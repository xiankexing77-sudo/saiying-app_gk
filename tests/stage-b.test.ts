import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { encode } from "jpeg-js";
import { SonyAdapter } from "../collectors/sony/adapter";
import { auditComplete, detectImageFormat, downloadOfficialImages, type ImageAudit } from "../src/lib/stage-b/cache";
import { loadOfficialImageFixture } from "../src/lib/stage-b/fixture";
import { listJuryPublicProfiles } from "../src/lib/stage-b/juries";
import { IMAGE_POLICY, imagePolicyRecord } from "../src/lib/stage-b/policy";
import { buildStageBReport, runStageB } from "../src/lib/stage-b/report";
import { measureAuditedBytes, measureAuditedFiles, webpSize } from "../src/lib/stage-b/vision";
import { aggregateWinners } from "../src/lib/stage-b/winners";
import type { OfficialImageFixture } from "../src/lib/stage-b/fixture";

function tinyJpeg() {
  const encoded = encode(
    {
      data: Buffer.from([255, 0, 0, 255, 0, 0, 0, 255]),
      width: 1,
      height: 2,
    },
    90,
  );
  return Buffer.from(encoded.data);
}

function responseFor(bytes: Buffer, url: string, status = 200) {
  const response = new Response(new Uint8Array(bytes), {
    status,
    headers: { "content-type": status === 200 ? "image/jpeg" : "text/plain" },
  });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

function fixtureFor(workId: string, sourceUrl: string): OfficialImageFixture {
  return {
    policy: "C",
    exportedAt: "2026-11-06T12:32:00.000Z",
    liveCrawl: false,
    stageALiveCrawl: false,
    note: "test",
    images: [
      {
        fixtureId: workId,
        workId,
        sourceUrl,
        pageUrl: "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
        pageTitle: "Overall Winners 2025",
        exportedAt: "2026-11-06T12:32:00.000Z",
        note: "test image",
      },
    ],
  };
}

test("image policy C requires an audited download and does not claim Stage A is done", () => {
  assert.equal(IMAGE_POLICY, "C");
  assert.equal(imagePolicyRecord.confirmedAt, "2026-11-06T00:08:00+08:00");
  assert.equal(imagePolicyRecord.requiresSourceUrl, true);
  assert.equal(imagePolicyRecord.requiresDownloadedAt, true);
  assert.equal(imagePolicyRecord.marketplacePublish, false);
  assert.equal(imagePolicyRecord.stageALiveCrawlClaimed, false);
  const fixture = loadOfficialImageFixture();
  assert.equal(fixture.liveCrawl, false);
  assert.equal(fixture.policy, "C");
  const adapter = new SonyAdapter();
  assert.equal(adapter.extractOfficialImages({ year: 2025, officialLabel: "2025" }).every((image) => image.officialImageUrl === null), true);
});

test("winner aggregate matches a Stage A fixture row and keeps missing image URLs empty", () => {
  const row = aggregateWinners({ year: 2025 }).find((item) => item.fixtureId === "single-2025-architecture");
  assert.ok(row);
  assert.equal(row.name, "Center of the Cosmos");
  assert.equal(row.authors[0]?.name, "Xuecheng Liu");
  assert.equal(row.category, "Architecture");
  assert.equal(row.awards.includes("Category Winner"), true);
  assert.equal(row.sourceUrl, "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look");
  assert.equal(row.liveCrawl, false);
  assert.equal(row.collectionMode, "curated_seed");
  assert.match(row.imageExport?.sourceUrl ?? "", /Xuecheng%20Liu/);
  const missing = aggregateWinners({ year: 2025 }).find((item) => item.fixtureId === "series-2025-creative");
  assert.equal(missing?.name, "Rhi-Entry");
  assert.equal(missing?.imageExport, null);
  assert.equal(aggregateWinners().every((item) => item.sourceUrl.startsWith("https://")), true);
});

test("jury profiles keep empty biography and education empty", () => {
  const monica2025 = listJuryPublicProfiles(2025).find((item) => item.juryId === "monica-allende");
  assert.ok(monica2025);
  assert.equal(monica2025.education, null);
  assert.deepEqual(monica2025.publications, []);
  assert.equal(monica2025.round, null);
  assert.match(monica2025.fields.find((field) => field.key === "biographyExcerpt")?.quote ?? "", /Sunday Times Magazine/);
  assert.equal(monica2025.sourceUrl, "https://www.worldphoto.org/sony-world-photography-awards/2025-judges");
  const monica2026 = listJuryPublicProfiles(2026).find((item) => item.juryId === "monica-allende");
  assert.equal(monica2026?.fields.some((field) => field.key === "biographyExcerpt"), false);
  assert.equal(monica2026?.education, null);
  const aldeide = listJuryPublicProfiles(2025).find((item) => item.juryId === "aldeide-delgado");
  assert.equal(aldeide?.fields.some((field) => field.key === "biographyExcerpt"), false);
  assert.equal(aldeide?.education, null);
});

test("download writes an audit and vision refuses unlabeled bytes", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-stage-b-"));
  const sourceUrl = "https://www.worldphoto.org/sites/default/files/stage-b-test.jpg";
  const bytes = tinyJpeg();
  assert.equal(detectImageFormat(bytes), "jpeg");
  const fixture = fixtureFor("single-2025-architecture", sourceUrl);
  const fetched = await downloadOfficialImages({
    cacheRoot,
    years: [2025],
    fixture,
    now: "2026-11-06T12:40:00.000Z",
    fetchImpl: (async (input) => responseFor(bytes, String(input))) as typeof fetch,
  });
  assert.equal(fetched.failures.length, 0);
  const audit = fetched.audits.find((item) => item.workId === "single-2025-architecture");
  assert.ok(audit);
  assert.equal(audit.sourceUrl, sourceUrl);
  assert.equal(audit.downloadedAt, "2026-11-06T12:40:00.000Z");
  assert.equal(existsSync(audit.storagePath), true);
  assert.equal(audit.policy, "C");

  const blocked = await downloadOfficialImages({
    cacheRoot: mkdtempSync(path.join(tmpdir(), "pji-stage-b-block-")),
    years: [2025],
    fixture: fixtureFor("single-2025-architecture", "https://example.com/sites/default/files/a.jpg"),
    fetchImpl: (async () => {
      throw new Error("should not fetch");
    }) as typeof fetch,
  });
  assert.equal(blocked.audits.length, 0);
  assert.match(blocked.failures[0]?.error ?? "", /拒绝主机/);

  const incomplete = { ...audit, sourceUrl: "", downloadedAt: "" };
  assert.equal(auditComplete(incomplete), false);
  const refused = measureAuditedBytes(incomplete as ImageAudit, bytes);
  assert.equal(refused.ok, false);

  const stray = path.join(cacheRoot, "stray.jpg");
  writeFileSync(stray, bytes);
  const vision = measureAuditedFiles([audit], new Map([[stray, bytes]]));
  assert.equal(vision.measurements.every((item) => item.workId === "single-2025-architecture"), true);
  assert.equal(vision.refusals.some((item) => item.reason.includes("无审计文件")), true);
  assert.equal(vision.measurements[0]?.pixelsRead, true);
  assert.equal(vision.measurements[0]?.sourceUrl, sourceUrl);
});

test("webp cache records dimensions without inventing color", () => {
  const width = 12;
  const height = 8;
  const chunk = Buffer.alloc(18);
  chunk.write("VP8X", 0);
  chunk.writeUInt32LE(10, 4);
  chunk.writeUIntLE(width - 1, 12, 3);
  chunk.writeUIntLE(height - 1, 15, 3);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0);
  header.writeUInt32LE(4 + chunk.length, 4);
  header.write("WEBP", 8);
  const bytes = Buffer.concat([header, chunk]);
  assert.deepEqual(webpSize(bytes), { width, height });
  const audit: ImageAudit = {
    workId: "single-2026-youth",
    fixtureId: "single-2026-youth",
    sourceUrl: "https://www.worldphoto.org/sites/default/files/styles/blog_teaser/public/example.webp",
    pageUrl: "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/overall-winners-2026",
    exportedAt: "2026-11-06T12:32:00.000Z",
    note: "test",
    downloadedAt: "2026-11-06T12:41:00.000Z",
    storagePath: "/tmp/not-read-webp",
    relativePath: "single-2026-youth.webp",
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    detectedFormat: "webp",
    httpContentType: "image/webp",
    policy: "C",
    liveCrawl: false,
  };
  const measured = measureAuditedBytes(audit, bytes);
  assert.equal(measured.ok, true);
  if (!measured.ok) return;
  assert.equal(measured.measurement.pixelsRead, false);
  assert.equal(measured.measurement.meanLuminance, null);
  assert.match(measured.measurement.quote, /不写色彩/);
});

test("draft keeps hypotheses out of the fact column and a failed download stays locatable", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-stage-b-run-"));
  const sourceUrl = "https://www.worldphoto.org/sites/default/files/stage-b-run.jpg";
  const bytes = tinyJpeg();
  const fixture = fixtureFor("single-2025-architecture", sourceUrl);
  const failed = await runStageB({
    years: [2025],
    cacheRoot,
    fixture,
    now: "2026-11-06T12:42:00.000Z",
    injectFailureWorkId: "single-2025-architecture",
    fetchImpl: (async () => {
      throw new Error("should not fetch");
    }) as typeof fetch,
  });
  assert.equal(failed.status, "failed");
  assert.match(failed.errorLog.join("\n"), /single-2025-architecture/);
  assert.match(failed.errorLog.join("\n"), /未写入像素/);
  assert.equal(failed.report.cache.some((item) => item.workId === "single-2025-architecture"), false);

  const passed = await runStageB({
    years: [2025],
    cacheRoot,
    fixture,
    now: "2026-11-06T12:43:00.000Z",
    fetchImpl: (async (input) => responseFor(bytes, String(input))) as typeof fetch,
  });
  assert.equal(passed.status, "succeeded");
  assert.equal(passed.report.cache[0]?.downloadedAt, "2026-11-06T12:43:00.000Z");
  assert.equal(passed.report.columns.fact.every((item) => item.kind === "fact" && item.evidence.quote.length > 0), true);
  assert.equal(passed.report.columns.hypothesis.every((item) => item.kind === "hypothesis" && item.hypothesis === true && item.presentedAsOfficialFact === false), true);
  assert.equal(passed.report.columns.fact.some((item) => item.kind === "hypothesis"), false);
  assert.equal(passed.report.statements.some((item) => item.kind === "hypothesis" && item.topic === "selection" && item.workId === "single-2025-architecture"), true);
  assert.equal(passed.report.externalVisionCalled, false);
  assert.equal(passed.report.marketplace, false);
  const stored = JSON.parse(readFileSync(path.join(cacheRoot, "manifest.json"), "utf8")) as { images: ImageAudit[] };
  assert.equal(stored.images[0]?.sourceUrl, sourceUrl);
});

test("report builder drops a cached image whose source is not in the fixture", () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-stage-b-stray-"));
  const bytes = tinyJpeg();
  const storagePath = path.join(cacheRoot, "unlisted.jpg");
  writeFileSync(storagePath, bytes);
  const audit: ImageAudit = {
    workId: "single-2025-architecture",
    fixtureId: "single-2025-architecture",
    sourceUrl: "https://www.worldphoto.org/sites/default/files/not-in-fixture.jpg",
    pageUrl: "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look",
    exportedAt: "2026-11-06T12:32:00.000Z",
    note: "unlisted",
    downloadedAt: "2026-11-06T12:44:00.000Z",
    storagePath,
    relativePath: "unlisted.jpg",
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    detectedFormat: "jpeg",
    httpContentType: "image/jpeg",
    policy: "C",
    liveCrawl: false,
  };
  writeFileSync(path.join(cacheRoot, "manifest.json"), JSON.stringify({ policy: "C", images: [audit] }));
  const report = buildStageBReport({ years: [2025], cacheRoot, fixture: fixtureFor("series-2025-wildlife", "https://www.worldphoto.org/sites/default/files/other.jpg") });
  assert.equal(report.cache.length, 0);
  assert.match(report.visionRefusals.map((item) => item.reason).join(" "), /不在本 cut/);
  assert.equal(report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement"), false);
});
