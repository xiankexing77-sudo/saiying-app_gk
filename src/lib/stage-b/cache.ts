import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { parsePublicHttps } from "../../../collectors/safety";
import { type OfficialImageFixture } from "./fixture";
import { listJuryPublicProfiles } from "./juries";
import { IMAGE_POLICY } from "./policy";
import { classifyIngest, classifySourceKind, type IdentityMatch, type PixelRights, type PixelSubject, type PublicPixelSource, type SourceKind } from "./source";
import { aggregateWinners } from "./winners";

export type DetectedImageFormat = "jpeg" | "png" | "webp";

export type ImageAudit = {
  subjectKind: PixelSubject;
  workId: string;
  fixtureId: string;
  juryId: string | null;
  sourceUrl: string;
  pageUrl: string;
  sourceKind: SourceKind;
  identityMatch: IdentityMatch;
  rightsStatus: PixelRights;
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
  subjectKind: PixelSubject;
  workId: string;
  fixtureId: string;
  juryId: string | null;
  sourceUrl: string;
  error: string;
  failureKind: "paywall_or_login" | "fetch" | "rejected" | "injected";
  retryable: boolean;
};

export type DownloadSkip = {
  subjectKind: PixelSubject;
  workId: string;
  fixtureId: string;
  reason: string;
};

export type UnlabeledPixel = {
  workId: string | null;
  sourceUrl: string | null;
  reason: string;
};

type IngestJob = {
  subjectKind: PixelSubject;
  subjectId: string;
  workId: string;
  fixtureId: string;
  juryId: string | null;
  sourceUrl: string;
  pageUrl: string;
  exportedAt: string;
  note: string;
  officialExport: boolean;
};

const MAX_BYTES = 8_000_000;
const PAYWALL_STATUS = new Set([401, 402, 403]);
const LOGIN_PATHS = new Set(["login", "log-in", "signin", "sign-in", "subscribe", "paywall", "checkout"]);

export function defaultCacheRoot() {
  return path.join(process.cwd(), "data/stage-b/cache");
}

export function detectImageFormat(bytes: Buffer): DetectedImageFormat | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

export function auditTrioMissing(audit: { sourceUrl?: string | null; downloadedAt?: string | null; storagePath?: string | null } | null | undefined) {
  const missing: Array<"sourceUrl" | "downloadedAt" | "storagePath"> = [];
  if (!audit?.sourceUrl?.trim()) missing.push("sourceUrl");
  if (!audit?.downloadedAt?.trim()) missing.push("downloadedAt");
  if (!audit?.storagePath?.trim()) missing.push("storagePath");
  return missing;
}

export function auditComplete(audit: Partial<ImageAudit> | null | undefined): audit is ImageAudit {
  if (!audit || auditTrioMissing(audit).length > 0) return false;
  if (audit.policy !== IMAGE_POLICY || audit.liveCrawl !== false) return false;
  if (audit.subjectKind !== "winner" && audit.subjectKind !== "jury") return false;
  if (audit.sourceKind !== "official" && audit.sourceKind !== "web_other") return false;
  if (audit.identityMatch !== "verified" && audit.identityMatch !== "unverified_match") return false;
  if (audit.rightsStatus !== "rights_blocked" && audit.rightsStatus !== "rights_unverified") return false;
  if (!audit.workId || audit.fixtureId !== audit.workId) return false;
  if (!audit.sourceUrl?.startsWith("https://") || !audit.sha256 || !audit.byteLength || audit.byteLength <= 0) return false;
  if (audit.subjectKind === "jury") return Boolean(audit.juryId) && audit.workId === `jury:${audit.juryId}`;
  return audit.juryId == null;
}

function manifestPath(cacheRoot: string) {
  return path.join(cacheRoot, "manifest.json");
}

export function readImageCache(cacheRoot = defaultCacheRoot()): { audits: ImageAudit[]; unlabeled: UnlabeledPixel[] } {
  const file = manifestPath(cacheRoot);
  if (!existsSync(/*turbopackIgnore: true*/ file)) return { audits: [], unlabeled: [] };
  const parsed = JSON.parse(readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as { policy?: string; images?: unknown } | null;
  if (!parsed || !Array.isArray(parsed.images)) throw new Error(`图像审计清单无法读取：${file}`);
  const rows = parsed.images.map((item) => (item && typeof item === "object" ? (item as Partial<ImageAudit>) : {}));
  if (parsed.policy !== IMAGE_POLICY) {
    return {
      audits: [],
      unlabeled: rows.map((item) => ({
        workId: item.workId ?? null,
        sourceUrl: item.sourceUrl ?? null,
        reason: "缓存策略不是 2026-11-06-B2，不进入视觉读取。",
      })),
    };
  }
  const audits: ImageAudit[] = [];
  const unlabeled: UnlabeledPixel[] = [];
  for (const item of rows) {
    if (auditComplete(item)) audits.push(item);
    else unlabeled.push({ workId: item.workId ?? null, sourceUrl: item.sourceUrl ?? null, reason: unlabeledReason(item) });
  }
  return { audits, unlabeled };
}

export function readImageAudits(cacheRoot = defaultCacheRoot()): ImageAudit[] {
  return readImageCache(cacheRoot).audits;
}

function unlabeledReason(audit: Partial<ImageAudit> | null | undefined) {
  const missing = auditTrioMissing(audit);
  if (missing.length) return `缺少审计字段 ${missing.join("、")}，不进入视觉读取。`;
  return "审计不完整或未标明来源种类，不进入视觉读取。";
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

function cacheKey(item: { subjectKind: string; workId: string; sourceUrl: string }) {
  return `${item.subjectKind}|${item.workId}|${item.sourceUrl}`;
}

function subjectWorkId(subjectKind: PixelSubject, subjectId: string) {
  return subjectKind === "jury" ? `jury:${subjectId}` : subjectId;
}

function paywallError(status: number, loginPage: boolean) {
  const why = loginPage ? "页面要求登录或付费" : "需要登录或付费";
  return `paywall_or_login: HTTP ${status} ${why}，未写入像素。可重试。`;
}

function looksLikeLoginUrl(input: string) {
  try {
    return new URL(input).pathname
      .toLowerCase()
      .split("/")
      .filter(Boolean)
      .some((part) => LOGIN_PATHS.has(part));
  } catch {
    return false;
  }
}

function looksLikeLoginHtml(headers: Headers, bytes: Buffer) {
  const type = (headers.get("content-type") ?? "").toLowerCase();
  if (!type.includes("text/html") && !type.includes("text/plain")) return false;
  const sample = bytes.subarray(0, 4000).toString("utf8").toLowerCase();
  return /paywall|sign in|log in|login|subscribe to continue|members only|create an account|请登录|登录后|订阅/.test(sample);
}

function classifyThrown(error: unknown): { message: string; failureKind: DownloadFailure["failureKind"]; retryable: boolean } {
  const message = error instanceof Error ? error.message : "下载失败";
  if (message.startsWith("paywall_or_login:")) return { message, failureKind: "paywall_or_login", retryable: true };
  if (/拒绝主机|必须是 https|不能携带凭据|非 443|无法解析/.test(message)) {
    return { message, failureKind: "rejected", retryable: false };
  }
  return { message, failureKind: "fetch", retryable: true };
}

export async function downloadOfficialImages(input: {
  cacheRoot?: string;
  years?: number[];
  fixture?: OfficialImageFixture;
  publicSources?: PublicPixelSource[];
  fetchImpl?: typeof fetch;
  now?: string;
  force?: boolean;
  injectFailureWorkId?: string | null;
}): Promise<{ audits: ImageAudit[]; failures: DownloadFailure[]; skipped: DownloadSkip[] }> {
  const cacheRoot = input.cacheRoot ?? defaultCacheRoot();
  const years = input.years ?? [2025, 2026];
  const fixture = input.fixture;
  const winners = aggregateWinners(fixture ? { fixture } : undefined).filter((item) => years.includes(item.editionYear));
  const juries = listJuryPublicProfiles().filter((item) => years.includes(item.editionYear));
  const knownWinners = new Set(aggregateWinners().map((item) => item.fixtureId));
  const knownJuries = new Set(listJuryPublicProfiles().map((item) => item.juryId));
  const winnersInRun = new Set(winners.map((item) => item.fixtureId));
  const juriesInRun = new Set(juries.map((item) => item.juryId));
  const exports = (fixture?.images ?? []).map((item) => ({ workId: item.workId, sourceUrl: item.sourceUrl }));
  const known = new Map(readImageAudits(cacheRoot).map((item) => [cacheKey(item), item]));
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? new Date().toISOString();
  const failures: DownloadFailure[] = [];
  const skipped: DownloadSkip[] = [];
  const audits: ImageAudit[] = [];
  const jobs: IngestJob[] = [];
  const seen = new Set<string>();

  function pushJob(job: IngestJob) {
    const key = cacheKey(job);
    if (seen.has(key)) return;
    seen.add(key);
    jobs.push(job);
  }

  for (const winner of winners) {
    const exported = winner.imageExport;
    if (!exported) {
      skipped.push({
        subjectKind: "winner",
        workId: winner.fixtureId,
        fixtureId: winner.fixtureId,
        reason: "fixture 未导出图像 URL，不下载、不入库。",
      });
      continue;
    }
    pushJob({
      subjectKind: "winner",
      subjectId: winner.fixtureId,
      workId: winner.fixtureId,
      fixtureId: winner.fixtureId,
      juryId: null,
      sourceUrl: exported.sourceUrl,
      pageUrl: exported.pageUrl,
      exportedAt: exported.exportedAt,
      note: exported.note,
      officialExport: true,
    });
  }

  for (const source of input.publicSources ?? []) {
    const workId = subjectWorkId(source.subjectKind, source.subjectId);
    const knownSubject = source.subjectKind === "winner" ? knownWinners.has(source.subjectId) : knownJuries.has(source.subjectId);
    if (!knownSubject) {
      failures.push({
        subjectKind: source.subjectKind,
        workId,
        fixtureId: workId,
        juryId: source.subjectKind === "jury" ? source.subjectId : null,
        sourceUrl: source.sourceUrl,
        error: source.subjectKind === "jury" ? `未知评委：${source.subjectId}` : `未知获奖作品：${source.subjectId}`,
        failureKind: "rejected",
        retryable: false,
      });
      continue;
    }
    const inRun = source.subjectKind === "winner" ? winnersInRun.has(source.subjectId) : juriesInRun.has(source.subjectId);
    if (!inRun) {
      skipped.push({
        subjectKind: source.subjectKind,
        workId,
        fixtureId: workId,
        reason: "不在本次届次范围内，不下载。",
      });
      continue;
    }
    pushJob({
      subjectKind: source.subjectKind,
      subjectId: source.subjectId,
      workId,
      fixtureId: workId,
      juryId: source.subjectKind === "jury" ? source.subjectId : null,
      sourceUrl: source.sourceUrl,
      pageUrl: source.pageUrl,
      exportedAt: now,
      note: source.note?.trim() || "公开网页图像。不是官方 fixture 导出。",
      officialExport: false,
    });
  }

  for (const job of jobs) {
    if (input.injectFailureWorkId && (input.injectFailureWorkId === job.subjectId || input.injectFailureWorkId === job.workId)) {
      failures.push({
        subjectKind: job.subjectKind,
        workId: job.workId,
        fixtureId: job.fixtureId,
        juryId: job.juryId,
        sourceUrl: job.sourceUrl,
        error: "注入的失败：未写入像素。重试时去掉 injectFailureWorkId 会再下载这一条。",
        failureKind: "injected",
        retryable: true,
      });
      continue;
    }
    try {
      classifySourceKind(job.sourceUrl);
      parsePublicHttps(job.pageUrl);
    } catch (error) {
      const classified = classifyThrown(error);
      failures.push({
        subjectKind: job.subjectKind,
        workId: job.workId,
        fixtureId: job.fixtureId,
        juryId: job.juryId,
        sourceUrl: job.sourceUrl,
        error: classified.message,
        failureKind: classified.failureKind,
        retryable: classified.retryable,
      });
      continue;
    }
    if (!job.pageUrl.trim() || !job.exportedAt.trim()) {
      failures.push({
        subjectKind: job.subjectKind,
        workId: job.workId,
        fixtureId: job.fixtureId,
        juryId: job.juryId,
        sourceUrl: job.sourceUrl,
        error: "缺少页面 URL 或导出时间",
        failureKind: "rejected",
        retryable: false,
      });
      continue;
    }
    const cached = known.get(cacheKey(job));
    if (!input.force && cached && cached.sourceUrl === job.sourceUrl && existsSync(/*turbopackIgnore: true*/ cached.storagePath)) {
      const bytes = readFileSync(/*turbopackIgnore: true*/ cached.storagePath);
      if (hash(bytes) === cached.sha256 && detectImageFormat(bytes) === cached.detectedFormat) {
        audits.push(cached);
        continue;
      }
    }
    try {
      audits.push(await downloadOne(cacheRoot, job, exports, fetchImpl, now));
    } catch (error) {
      const classified = classifyThrown(error);
      failures.push({
        subjectKind: job.subjectKind,
        workId: job.workId,
        fixtureId: job.fixtureId,
        juryId: job.juryId,
        sourceUrl: job.sourceUrl,
        error: classified.message,
        failureKind: classified.failureKind,
        retryable: classified.retryable,
      });
    }
  }

  const jobKeys = new Set(jobs.map((job) => cacheKey(job)));
  const preserved = [...known.values()].filter((item) => !jobKeys.has(cacheKey(item)));
  writeManifest(cacheRoot, [...preserved, ...audits]);
  return { audits, failures, skipped };
}

async function downloadOne(cacheRoot: string, job: IngestJob, officialExports: { workId: string; sourceUrl: string }[], fetchImpl: typeof fetch, now: string): Promise<ImageAudit> {
  const requestedUrl = job.sourceUrl;
  const response = await fetchImpl(requestedUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(25_000),
    headers: {
      accept: "image/jpeg,image/png,image/webp,text/html",
      "user-agent": "PhotoJuryIntelligence/stage-b",
    },
  });
  const finalUrl = response.url || requestedUrl;
  const bytes = Buffer.from(await response.arrayBuffer());
  const loginPage = looksLikeLoginUrl(finalUrl) || looksLikeLoginHtml(response.headers, bytes) || Boolean(response.headers.get("www-authenticate"));
  if (PAYWALL_STATUS.has(response.status) || (loginPage && response.status === 200)) {
    throw new Error(paywallError(response.status, loginPage));
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  classifySourceKind(finalUrl);
  const officialRequested = job.officialExport && classifySourceKind(requestedUrl) === "official";
  if (officialRequested && classifySourceKind(finalUrl) !== "official") {
    throw new Error(`重定向离开官方主机：${finalUrl}`);
  }
  const storedUrl = officialRequested ? requestedUrl : finalUrl;
  if (bytes.length === 0) throw new Error("空响应");
  if (bytes.length > MAX_BYTES) throw new Error("超过 8MB，拒绝入库");
  const detectedFormat = detectImageFormat(bytes);
  if (!detectedFormat) throw new Error("响应不是 jpeg、png 或 webp，拒绝入库");
  const labels = classifyIngest({
    subjectKind: job.subjectKind,
    subjectId: job.subjectId,
    sourceUrl: storedUrl,
    officialExports,
  });
  const slug = hash(Buffer.from(storedUrl)).slice(0, 12);
  const safeId = job.workId.replace(/[^a-z0-9-]+/gi, "-");
  const relativePath = `${safeId}-${slug}.${extension(detectedFormat)}`;
  const storagePath = path.join(cacheRoot, relativePath);
  mkdirSync(/*turbopackIgnore: true*/ cacheRoot, { recursive: true });
  const tmp = `${storagePath}.tmp`;
  writeFileSync(/*turbopackIgnore: true*/ tmp, bytes);
  renameSync(/*turbopackIgnore: true*/ tmp, storagePath);
  const httpContentType = (response.headers.get("content-type") ?? "").split(";")[0]?.trim() || detectedFormat;
  return {
    subjectKind: job.subjectKind,
    workId: job.workId,
    fixtureId: job.fixtureId,
    juryId: job.juryId,
    sourceUrl: storedUrl,
    pageUrl: job.pageUrl,
    sourceKind: labels.sourceKind,
    identityMatch: labels.identityMatch,
    rightsStatus: labels.rightsStatus,
    exportedAt: job.exportedAt,
    note: job.note,
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
