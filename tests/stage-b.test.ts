import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { encode } from "jpeg-js";
import { SonyAdapter } from "../collectors/sony/adapter";
import { auditComplete, detectImageFormat, downloadOfficialImages, type ImageAudit } from "../src/lib/stage-b/cache";
import { loadOfficialImageFixture, type OfficialImageFixture } from "../src/lib/stage-b/fixture";
import { listJuryPublicProfiles } from "../src/lib/stage-b/juries";
import { IMAGE_POLICY, imagePolicyRecord, STAGE_B_CUT } from "../src/lib/stage-b/policy";
import { buildStageBReport, runStageB } from "../src/lib/stage-b/report";
import { classifySourceKind, parsePublicSources } from "../src/lib/stage-b/source";
import { measureAuditedBytes, measureAuditedFiles, webpSize } from "../src/lib/stage-b/vision";
import { aggregateWinners } from "../src/lib/stage-b/winners";

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

function responseFor(bytes: Buffer, url: string, status = 200, contentType?: string) {
  const type = contentType ?? (status === 200 ? "image/jpeg" : "text/plain");
  const response = new Response(new Uint8Array(bytes), {
    status,
    headers: { "content-type": type },
  });
  Object.defineProperty(response, "url", { value: url });
  return response;
}

function fixtureFor(workId: string, sourceUrl: string): OfficialImageFixture {
  return {
    policy: "B2",
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

function emptyFixture(): OfficialImageFixture {
  return { ...fixtureFor("single-2025-architecture", "https://www.worldphoto.org/sites/default/files/unused.jpg"), images: [] };
}

function asFetch(impl: (input: RequestInfo | URL) => Promise<Response>): typeof fetch {
  return impl as typeof fetch;
}

test("image policy B2 requires an audited public download and does not claim Stage A is done", () => {
  assert.equal(STAGE_B_CUT, "2026-11-06-B2");
  assert.equal(IMAGE_POLICY, "B2");
  assert.equal(imagePolicyRecord.cut, "2026-11-06-B2");
  assert.equal(imagePolicyRecord.confirmedAt, "2026-11-06T00:00:00+08:00");
  assert.equal(imagePolicyRecord.approvedOn, "2026-11-06");
  assert.equal(imagePolicyRecord.approvedZone, "Asia/Shanghai");
  assert.equal(imagePolicyRecord.requiresSourceUrl, true);
  assert.equal(imagePolicyRecord.requiresDownloadedAt, true);
  assert.equal(imagePolicyRecord.requiresStoragePath, true);
  assert.equal(imagePolicyRecord.publicWebSources, true);
  assert.equal(imagePolicyRecord.nonOfficialAuditedSources, true);
  assert.equal(imagePolicyRecord.unlabeledSources, false);
  assert.equal(imagePolicyRecord.marketplacePublish, false);
  assert.equal(imagePolicyRecord.stageALiveCrawlClaimed, false);
  const fixture = loadOfficialImageFixture();
  assert.equal(fixture.liveCrawl, false);
  assert.equal(fixture.stageALiveCrawl, false);
  assert.equal(fixture.policy, "B2");
  assert.equal(fixture.images.every((item) => classifySourceKind(item.sourceUrl) === "official"), true);
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
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(fetched.failures.length, 0);
  const audit = fetched.audits.find((item) => item.workId === "single-2025-architecture");
  assert.ok(audit);
  assert.equal(audit.sourceUrl, sourceUrl);
  assert.equal(audit.downloadedAt, "2026-11-06T12:40:00.000Z");
  assert.equal(existsSync(audit.storagePath), true);
  assert.equal(audit.storagePath.length > 0, true);
  assert.equal(audit.policy, "B2");
  assert.equal(audit.sourceKind, "official");

  const blocked = await downloadOfficialImages({
    cacheRoot: mkdtempSync(path.join(tmpdir(), "pji-stage-b-block-")),
    years: [2025],
    fixture: fixtureFor("single-2025-architecture", "https://127.0.0.1/sites/default/files/a.jpg"),
    fetchImpl: asFetch(async () => {
      throw new Error("should not fetch");
    }),
  });
  assert.equal(blocked.audits.length, 0);
  assert.equal(blocked.failures[0]?.failureKind, "rejected");
  assert.equal(blocked.failures[0]?.retryable, false);
  assert.match(blocked.failures[0]?.error ?? "", /拒绝主机/);

  const incomplete = { ...audit, sourceUrl: "", downloadedAt: "" };
  assert.equal(auditComplete(incomplete), false);
  const refused = measureAuditedBytes(incomplete as ImageAudit, bytes);
  assert.equal(refused.ok, false);
  if (!refused.ok) assert.match(refused.refusal.reason, /sourceUrl/);

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
    subjectKind: "winner",
    workId: "single-2026-youth",
    fixtureId: "single-2026-youth",
    juryId: null,
    sourceUrl: "https://www.worldphoto.org/sites/default/files/styles/blog_teaser/public/example.webp",
    pageUrl: "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/overall-winners-2026",
    sourceKind: "official",
    identityMatch: "verified",
    rightsStatus: "rights_blocked",
    exportedAt: "2026-11-06T12:32:00.000Z",
    note: "test",
    downloadedAt: "2026-11-06T12:41:00.000Z",
    storagePath: "/tmp/not-read-webp",
    relativePath: "single-2026-youth.webp",
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    detectedFormat: "webp",
    httpContentType: "image/webp",
    policy: "B2",
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
    fetchImpl: asFetch(async () => {
      throw new Error("should not fetch");
    }),
  });
  assert.equal(failed.status, "failed");
  assert.match(failed.errorLog.join("\n"), /single-2025-architecture/);
  assert.match(failed.errorLog.join("\n"), /未写入像素/);
  assert.equal(failed.downloaded.failures[0]?.retryable, true);
  assert.equal(failed.report.cache.some((item) => item.workId === "single-2025-architecture"), false);

  const passed = await runStageB({
    years: [2025],
    cacheRoot,
    fixture,
    now: "2026-11-06T12:43:00.000Z",
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(passed.status, "succeeded");
  assert.equal(passed.report.cache[0]?.downloadedAt, "2026-11-06T12:43:00.000Z");
  assert.equal(passed.report.cache[0]?.sourceKind, "official");
  assert.equal(passed.report.columns.fact.every((item) => item.kind === "fact" && item.evidence.quote.length > 0), true);
  assert.equal(passed.report.columns.hypothesis.every((item) => item.kind === "hypothesis" && item.hypothesis === true && item.presentedAsOfficialFact === false), true);
  assert.equal(passed.report.columns.fact.some((item) => item.kind === "hypothesis"), false);
  assert.equal(passed.report.statements.some((item) => item.kind === "hypothesis" && item.topic === "selection" && item.workId === "single-2025-architecture"), true);
  assert.equal(passed.report.externalVisionCalled, false);
  assert.equal(passed.report.marketplace, false);
  assert.equal(passed.report.stageA, "fixture_only_not_done");
  assert.equal(passed.report.cut, "2026-11-06-B2");
  const stored = JSON.parse(readFileSync(path.join(cacheRoot, "manifest.json"), "utf8")) as { policy: string; images: ImageAudit[] };
  assert.equal(stored.policy, "B2");
  assert.equal(stored.images[0]?.sourceUrl, sourceUrl);
});

test("AC-B2-1 winners ingest a non-official public source with the audit trio", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-winner-"));
  const sourceUrl = "https://news.example/gallery/center-of-the-cosmos.jpg";
  const pageUrl = "https://news.example/gallery/swpa-2025";
  const bytes = tinyJpeg();
  const ran = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: emptyFixture(),
    now: "2026-11-06T13:00:00.000Z",
    publicSources: [{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl, pageUrl, note: "news gallery" }],
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(ran.status, "succeeded");
  const audit = ran.downloaded.audits.find((item) => item.workId === "single-2025-architecture");
  assert.ok(audit);
  assert.equal(audit.sourceKind, "web_other");
  assert.equal(audit.subjectKind, "winner");
  assert.equal(audit.sourceUrl, sourceUrl);
  assert.equal(audit.pageUrl, pageUrl);
  assert.equal(audit.downloadedAt, "2026-11-06T13:00:00.000Z");
  assert.equal(existsSync(audit.storagePath), true);
  assert.equal(audit.storagePath.startsWith(cacheRoot), true);
  assert.equal(ran.report.cache.some((item) => item.sourceUrl === sourceUrl && item.sourceKind === "web_other"), true);
});

test("AC-B2-2 juries ingest a non-official public sample with the audit trio", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-jury-"));
  const sourceUrl = "https://author.example/portraits/monica-allende.jpg";
  const pageUrl = "https://author.example/about";
  const bytes = tinyJpeg();
  const ran = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: emptyFixture(),
    now: "2026-11-06T13:01:00.000Z",
    publicSources: [{ subjectKind: "jury", subjectId: "monica-allende", sourceUrl, pageUrl }],
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(ran.status, "succeeded");
  const audit = ran.downloaded.audits.find((item) => item.juryId === "monica-allende");
  assert.ok(audit);
  assert.equal(audit.subjectKind, "jury");
  assert.equal(audit.workId, "jury:monica-allende");
  assert.equal(audit.sourceKind, "web_other");
  assert.equal(audit.sourceUrl, sourceUrl);
  assert.equal(audit.downloadedAt, "2026-11-06T13:01:00.000Z");
  assert.equal(existsSync(audit.storagePath), true);
  assert.equal(ran.report.cache.some((item) => item.juryId === "monica-allende" && item.sourceKind === "web_other"), true);
  const parsed = parsePublicSources([{ subjectKind: "jury", subjectId: "monica-allende", sourceUrl, pageUrl }]);
  assert.equal(Array.isArray(parsed), true);
  const rejected = parsePublicSources([{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl }]);
  assert.equal("error" in rejected, true);
});

test("AC-B2-3 official fixture path still caches sourceKind=official", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-official-"));
  const sourceUrl = "https://www.worldphoto.org/sites/default/files/stage-b-official.jpg";
  const bytes = tinyJpeg();
  const fixture = fixtureFor("single-2025-architecture", sourceUrl);
  const ran = await runStageB({
    years: [2025],
    cacheRoot,
    fixture,
    now: "2026-11-06T13:02:00.000Z",
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(ran.status, "succeeded");
  const audit = ran.report.cache.find((item) => item.workId === "single-2025-architecture");
  assert.ok(audit);
  assert.equal(audit.sourceKind, "official");
  assert.equal(audit.identityMatch, "verified");
  assert.equal(audit.rightsStatus, "rights_blocked");
  assert.equal(audit.sourceUrl, sourceUrl);
  assert.equal(audit.downloadedAt, "2026-11-06T13:02:00.000Z");
  assert.equal(existsSync(audit.storagePath), true);
  assert.equal(ran.report.withheld.some((item) => item.sourceUrl === sourceUrl), false);
  assert.equal(
    ran.report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement" && item.workId === "single-2025-architecture" && item.evidence.sourceUrl === sourceUrl),
    true,
  );

  const redirected = await downloadOfficialImages({
    cacheRoot: mkdtempSync(path.join(tmpdir(), "pji-b2-redirect-")),
    years: [2025],
    fixture,
    fetchImpl: asFetch(async () => responseFor(bytes, "https://cdn.example/left-official.jpg")),
  });
  assert.equal(redirected.audits.length, 0);
  assert.match(redirected.failures[0]?.error ?? "", /重定向离开官方主机/);
});

test("AC-B2-4 pixels missing any audit field never enter vision", async () => {
  const bytes = tinyJpeg();
  const sourceUrl = "https://www.worldphoto.org/sites/default/files/stage-b-audit.jpg";
  const storagePath = path.join(mkdtempSync(path.join(tmpdir(), "pji-b2-audit-")), "pixel.jpg");
  writeFileSync(storagePath, bytes);
  const complete: ImageAudit = {
    subjectKind: "winner",
    workId: "single-2025-architecture",
    fixtureId: "single-2025-architecture",
    juryId: null,
    sourceUrl,
    pageUrl: "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look",
    sourceKind: "official",
    identityMatch: "verified",
    rightsStatus: "rights_blocked",
    exportedAt: "2026-11-06T12:32:00.000Z",
    note: "test",
    downloadedAt: "2026-11-06T13:03:00.000Z",
    storagePath,
    relativePath: "pixel.jpg",
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    detectedFormat: "jpeg",
    httpContentType: "image/jpeg",
    policy: "B2",
    liveCrawl: false,
  };
  assert.equal(measureAuditedBytes(complete, bytes).ok, true);
  for (const field of ["sourceUrl", "downloadedAt", "storagePath"] as const) {
    const broken = { ...complete, [field]: "" };
    const refused = measureAuditedBytes(broken as ImageAudit, bytes);
    assert.equal(refused.ok, false);
    if (!refused.ok) assert.match(refused.refusal.reason, new RegExp(field));
    const files = measureAuditedFiles([broken as ImageAudit]);
    assert.equal(files.measurements.length, 0);
    assert.match(files.refusals[0]?.reason ?? "", new RegExp(field));
  }

  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-missing-"));
  const dropped = { ...complete, downloadedAt: "", storagePath };
  writeFileSync(path.join(cacheRoot, "manifest.json"), JSON.stringify({ policy: "B2", images: [dropped] }));
  const report = buildStageBReport({ years: [2025], cacheRoot, fixture: fixtureFor("single-2025-architecture", sourceUrl) });
  assert.equal(report.cache.some((item) => item.workId === "single-2025-architecture"), false);
  assert.match(report.visionRefusals.map((item) => item.reason).join(" "), /downloadedAt/);
  assert.equal(report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement" && item.evidence.sourceUrl === sourceUrl), false);

  const oldCut = mkdtempSync(path.join(tmpdir(), "pji-b2-old-policy-"));
  writeFileSync(path.join(oldCut, "manifest.json"), JSON.stringify({ policy: "C", images: [complete] }));
  const ignored = buildStageBReport({ years: [2025], cacheRoot: oldCut, fixture: fixtureFor("single-2025-architecture", sourceUrl) });
  assert.equal(ignored.cache.length, 0);
  assert.match(ignored.visionRefusals.map((item) => item.reason).join(" "), /2026-11-06-B2/);
  assert.equal(ignored.columns.fact.some((item) => item.topic === "vision_measurement"), false);
});

test("AC-B2-5 unverified_match and rights_unverified stay out of the fact column", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-withheld-"));
  const sourceUrl = "https://press.example/photos/center.jpg";
  const bytes = tinyJpeg();
  const ran = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: emptyFixture(),
    now: "2026-11-06T13:04:00.000Z",
    publicSources: [{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl, pageUrl: "https://press.example/swpa" }],
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  const audit = ran.downloaded.audits[0];
  assert.equal(audit?.sourceKind, "web_other");
  assert.equal(audit?.identityMatch, "unverified_match");
  assert.equal(audit?.rightsStatus, "rights_unverified");
  const withheld = ran.report.withheld.find((item) => item.sourceUrl === sourceUrl);
  assert.ok(withheld);
  assert.equal(withheld.inFactColumn, false);
  assert.equal(withheld.presentedAsOfficialFact, false);
  assert.equal(withheld.identityMatch, "unverified_match");
  assert.equal(withheld.rightsStatus, "rights_unverified");
  assert.equal(withheld.reasons.includes("unverified_match"), true);
  assert.equal(withheld.reasons.includes("rights_unverified"), true);
  assert.equal(withheld.reasons.includes("web_other"), true);
  assert.equal(typeof withheld.measurementQuote, "string");
  assert.equal(ran.report.columns.fact.some((item) => item.kind === "fact" && item.evidence.sourceUrl === sourceUrl), false);
  assert.equal(ran.report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement" && item.workId === "single-2025-architecture"), false);

  const liedRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-lied-"));
  const liedPath = path.join(liedRoot, "lied.jpg");
  writeFileSync(liedPath, bytes);
  const liedUrl = "https://www.worldphoto.org/sites/default/files/not-in-fixture.jpg";
  const lied: ImageAudit = {
    subjectKind: "winner",
    workId: "single-2025-architecture",
    fixtureId: "single-2025-architecture",
    juryId: null,
    sourceUrl: liedUrl,
    pageUrl: "https://www.worldphoto.org/blogs/07-03-25/open-category-winners-and-shortlist-first-look",
    sourceKind: "official",
    identityMatch: "verified",
    rightsStatus: "rights_blocked",
    exportedAt: "2026-11-06T12:32:00.000Z",
    note: "labeled as official but not in the fixture",
    downloadedAt: "2026-11-06T13:05:00.000Z",
    storagePath: liedPath,
    relativePath: "lied.jpg",
    byteLength: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    detectedFormat: "jpeg",
    httpContentType: "image/jpeg",
    policy: "B2",
    liveCrawl: false,
  };
  writeFileSync(path.join(liedRoot, "manifest.json"), JSON.stringify({ policy: "B2", images: [lied] }));
  const report = buildStageBReport({
    years: [2025],
    cacheRoot: liedRoot,
    fixture: fixtureFor("series-2025-wildlife", "https://www.worldphoto.org/sites/default/files/other.jpg"),
  });
  assert.equal(report.cache.length, 1);
  assert.equal(report.cache[0]?.sourceKind, "official");
  assert.equal(report.cache[0]?.identityMatch, "unverified_match");
  assert.equal(report.cache[0]?.rightsStatus, "rights_unverified");
  assert.equal(report.withheld[0]?.inFactColumn, false);
  assert.equal(report.withheld[0]?.presentedAsOfficialFact, false);
  assert.match(report.withheld[0]?.measurementQuote ?? "", /缓存图测量/);
  assert.equal(report.visionRefusals.some((item) => item.reason.includes("不在本 cut")), false);
  assert.equal(report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement" && item.evidence.sourceUrl === liedUrl), false);
});

test("AC-B2-6 paywall and login failures are visible and retryable", async () => {
  const bytes = tinyJpeg();
  const sourceUrl = "https://www.worldphoto.org/sites/default/files/stage-b-paywall.jpg";
  const fixture = fixtureFor("single-2025-architecture", sourceUrl);
  for (const status of [401, 402, 403]) {
    const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-paywall-"));
    const failed = await runStageB({
      years: [2025],
      cacheRoot,
      fixture,
      now: "2026-11-06T13:06:00.000Z",
      fetchImpl: asFetch(async (input) => responseFor(Buffer.from("denied"), String(input), status)),
    });
    assert.equal(failed.status, "failed");
    assert.equal(failed.downloaded.failures[0]?.failureKind, "paywall_or_login");
    assert.equal(failed.downloaded.failures[0]?.retryable, true);
    assert.equal(failed.downloaded.audits.length, 0);
    assert.match(failed.errorLog.join("\n"), /paywall_or_login/);
    assert.match(failed.errorLog.join("\n"), /retryable=true/);
    assert.match(failed.errorLog.join("\n"), new RegExp(sourceUrl));
    assert.match(failed.errorLog.join("\n"), /可重试/);
    assert.equal(failed.report.cache.some((item) => item.sourceUrl === sourceUrl), false);
  }

  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-retry-"));
  let attempt = 0;
  const fetchImpl = asFetch(async (input) => {
    attempt += 1;
    const url = String(input);
    if (attempt === 1) return responseFor(Buffer.from("<html>Please log in to continue</html>"), "https://news.example/login", 200, "text/html");
    return responseFor(bytes, url, 200, "image/jpeg");
  });
  const loginUrl = "https://gallery.example/swpa/center.jpg";
  const first = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: emptyFixture(),
    now: "2026-11-06T13:07:00.000Z",
    publicSources: [{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl: loginUrl, pageUrl: "https://gallery.example/swpa" }],
    fetchImpl,
  });
  assert.equal(first.downloaded.failures[0]?.failureKind, "paywall_or_login");
  assert.equal(first.downloaded.failures[0]?.retryable, true);
  assert.match(first.errorLog.join("\n"), /paywall_or_login/);
  assert.equal(existsSync(path.join(cacheRoot, "manifest.json")), true);
  const manifest = JSON.parse(readFileSync(path.join(cacheRoot, "manifest.json"), "utf8")) as { images: ImageAudit[] };
  assert.equal(manifest.images.some((item) => item.sourceUrl === loginUrl), false);

  const second = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: emptyFixture(),
    now: "2026-11-06T13:08:00.000Z",
    publicSources: [{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl: loginUrl, pageUrl: "https://gallery.example/swpa" }],
    fetchImpl,
  });
  assert.equal(second.status, "succeeded");
  assert.equal(second.downloaded.audits[0]?.sourceUrl, loginUrl);
  assert.equal(second.downloaded.audits[0]?.sourceKind, "web_other");
  assert.equal(existsSync(second.downloaded.audits[0]?.storagePath ?? ""), true);
});

test("AC-B2-7 the report still splits fact and hypothesis", async () => {
  const cacheRoot = mkdtempSync(path.join(tmpdir(), "pji-b2-columns-"));
  const officialUrl = "https://www.worldphoto.org/sites/default/files/stage-b-columns.jpg";
  const otherUrl = "https://mirror.example/stage-b-columns.jpg";
  const bytes = tinyJpeg();
  const ran = await runStageB({
    years: [2025],
    cacheRoot,
    fixture: fixtureFor("single-2025-architecture", officialUrl),
    now: "2026-11-06T13:09:00.000Z",
    publicSources: [{ subjectKind: "winner", subjectId: "single-2025-architecture", sourceUrl: otherUrl, pageUrl: "https://mirror.example/work" }],
    fetchImpl: asFetch(async (input) => responseFor(bytes, String(input))),
  });
  assert.equal(ran.report.stageA, "fixture_only_not_done");
  assert.equal(ran.report.marketplace, false);
  assert.equal(ran.report.columns.fact.length > 0, true);
  assert.equal(ran.report.columns.hypothesis.length > 0, true);
  assert.equal(ran.report.columns.fact.every((item) => item.kind === "fact" && item.column === "fact"), true);
  assert.equal(ran.report.columns.hypothesis.every((item) => item.kind === "hypothesis" && item.column === "hypothesis" && item.presentedAsOfficialFact === false), true);
  const factIds = new Set(ran.report.columns.fact.map((item) => item.id));
  assert.equal(ran.report.columns.hypothesis.some((item) => factIds.has(item.id)), false);
  assert.equal(ran.report.columns.fact.some((item) => item.kind === "fact" && item.topic === "vision_measurement" && item.evidence.sourceUrl === officialUrl), true);
  assert.equal(ran.report.columns.fact.some((item) => item.kind === "fact" && item.evidence.sourceUrl === otherUrl), false);
  assert.equal(ran.report.withheld.some((item) => item.sourceUrl === otherUrl && item.inFactColumn === false), true);
});
