import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parsePublicHttps } from "../../../collectors/safety";
import { assertOfficialImageUrl, type OfficialImageExport, type OfficialImageFixture } from "./fixture";
import { IMAGE_POLICY } from "./policy";
import { aggregateWinners } from "./winners";

export type DetectedImageFormat = "jpeg" | "png" | "webp";

export type ImageAudit = {
  workId: string;
  fixtureId: string;
  sourceUrl: string;
  pageUrl: string;
  exportedAt: string;
  note: string;
  downloadedAt: string;
  storagePath: string;
  relativePath: string;
  byteLength: number;
  sha256: string;
  detectedFormat: DetectedImageFormat;
  httpContentType: string;
  policy: typeof IMAGE_POLICY;
  liveCrawl: false;
};

export type DownloadFailure = {
  workId: string;
  fixtureId: string;
  sourceUrl: string;
  error: string;
};

export type DownloadSkip = {
  workId: string;
  fixtureId: string;
  reason: string;
};

type Manifest = { policy: typeof IMAGE_POLICY; images: ImageAudit[] };

const MAX_BYTES = 8_000_000;

export function defaultCacheRoot() {
  return path.join(process.cwd(), "data/stage-b/cache");
}

export function detectImageFormat(bytes: Buffer): DetectedImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function auditComplete(audit: Partial<ImageAudit> | null | undefined): audit is ImageAudit {
  return Boolean(
    audit &&
      audit.policy === IMAGE_POLICY &&
      audit.liveCrawl === false &&
      audit.workId &&
      audit.fixtureId === audit.workId &&
      audit.sourceUrl?.startsWith("https://") &&
      audit.downloadedAt &&
      audit.storagePath &&
      audit.sha256 &&
      audit.byteLength &&
      audit.byteLength > 0,
  );
}

function manifestPath(cacheRoot: string) {
  return path.join(cacheRoot, "manifest.json");
}

export function readImageAudits(cacheRoot = defaultCacheRoot()): ImageAudit[] {
  const file = manifestPath(cacheRoot);
  if (!existsSync(/*turbopackIgnore: true*/ file)) return [];
  const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as Manifest;
  if (!parsed || parsed.policy !== IMAGE_POLICY || !Array.isArray(parsed.images)) {
    throw new Error(`图像审计清单无法读取：${file}`);
  }
  return parsed.images.filter(auditComplete);
}

function writeManifest(cacheRoot: string, images: ImageAudit[]) {
  mkdirSync(/*turbopackIgnore: true*/ cacheRoot, { recursive: true });
  const file = manifestPath(cacheRoot);
  const tmp = `${file}.tmp`;
  writeFileSync(/*turbopackIgnore: true*/ tmp, JSON.stringify({ policy: IMAGE_POLICY, images }, null, 2));
  renameSync(/*turbopackIgnore: true*/ tmp, file);
}

function hash(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function extension(format: DetectedImageFormat) {
  if (format === "jpeg") return "jpg";
  if (format === "png") return "png";
  return "webp";
}

function sameHost(left: string, right: string) {
  return parsePublicHttps(left).hostname.toLowerCase() === parsePublicHttps(right).hostname.toLowerCase();
}

export async function downloadOfficialImages(input: {
  cacheRoot?: string;
  years?: number[];
  fixture?: OfficialImageFixture;
  fetchImpl?: typeof fetch;
  now?: string;
  force?: boolean;
  injectFailureWorkId?: string | null;
}): Promise<{ audits: ImageAudit[]; failures: DownloadFailure[]; skipped: DownloadSkip[] }> {
  const cacheRoot = input.cacheRoot ?? defaultCacheRoot();
  const years = input.years ?? [2025, 2026];
  const winners = aggregateWinners({ fixture: input.fixture }).filter((item) => years.includes(item.editionYear));
  const known = new Map(readImageAudits(cacheRoot).map((item) => [item.workId, item]));
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date().toISOString();
  const failures: DownloadFailure[] = [];
  const skipped: DownloadSkip[] = [];
  const audits: ImageAudit[] = [];

  for (const winner of winners) {
    const exported = winner.imageExport;
    if (!exported) {
      skipped.push({
        workId: winner.fixtureId,
        fixtureId: winner.fixtureId,
        reason: "fixture 未导出官方图像 URL，不下载、不入库。",
      });
      continue;
    }
    if (input.injectFailureWorkId === winner.fixtureId) {
      failures.push({
        workId: winner.fixtureId,
        fixtureId: winner.fixtureId,
        sourceUrl: exported.sourceUrl,
        error: "注入的失败：未写入像素。重试时去掉 injectFailureWorkId 会再下载这一条。",
      });
      continue;
    }
    const cached = known.get(winner.fixtureId);
    if (!input.force && cached && cached.sourceUrl === exported.sourceUrl && existsSync(/*turbopackIgnore: true*/ cached.storagePath)) {
      const bytes = readFileSync(/*turbopackIgnore: true*/ cached.storagePath);
      if (hash(bytes) === cached.sha256 && detectImageFormat(bytes) === cached.detectedFormat) {
        audits.push(cached);
        continue;
      }
    }
    try {
      audits.push(await downloadOne(cacheRoot, exported, fetchImpl, now));
    } catch (error) {
      failures.push({
        workId: exported.workId,
        fixtureId: exported.fixtureId,
        sourceUrl: exported.sourceUrl,
        error: error instanceof Error ? error.message : "下载失败",
      });
    }
  }

  const inScope = new Set(winners.map((item) => item.fixtureId));
  const preserved = [...known.values()].filter((item) => !inScope.has(item.workId));
  writeManifest(cacheRoot, [...preserved, ...audits]);
  return { audits, failures, skipped };
}

async function downloadOne(cacheRoot: string, exported: OfficialImageExport, fetchImpl: typeof fetch, now: string): Promise<ImageAudit> {
  const sourceUrl = assertOfficialImageUrl(exported.sourceUrl);
  if (!exported.pageUrl.trim() || !exported.exportedAt.trim()) {
    throw new Error("缺少页面 URL 或导出时间");
  }
  const response = await fetchImpl(sourceUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: {
      accept: "image/jpeg,image/png,image/webp",
      "user-agent": "PhotoJuryIntelligence/stage-b",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const finalUrl = response.url || sourceUrl;
  if (!sameHost(sourceUrl, finalUrl)) throw new Error(`重定向离开官方主机：${finalUrl}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error("空响应");
  if (bytes.length > MAX_BYTES) throw new Error("超过 8MB，拒绝入库");
  const detectedFormat = detectImageFormat(bytes);
  if (!detectedFormat) throw new Error("响应不是 jpeg、png 或 webp，拒绝入库");
  const relativePath = `${exported.workId}.${extension(detectedFormat)}`;
  const storagePath = path.join(cacheRoot, relativePath);
  mkdirSync(/*turbopackIgnore: true*/ cacheRoot, { recursive: true });
  const tmp = `${storagePath}.tmp`;
  writeFileSync(/*turbopackIgnore: true*/ tmp, bytes);
  renameSync(/*turbopackIgnore: true*/ tmp, storagePath);
  const httpContentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() || detectedFormat;
  return {
    workId: exported.workId,
    fixtureId: exported.fixtureId,
    sourceUrl,
    pageUrl: exported.pageUrl,
    exportedAt: exported.exportedAt,
    note: exported.note,
    downloadedAt: now,
    storagePath,
    relativePath,
    byteLength: bytes.length,
    sha256: hash(bytes),
    detectedFormat,
    httpContentType,
    policy: IMAGE_POLICY,
    liveCrawl: false,
  };
}
