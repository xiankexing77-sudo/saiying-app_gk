import { downloadOfficialImages, readImageAudits, type ImageAudit } from "./cache";
import { buildResearchDraft, type ResearchStatement } from "./draft";
import { loadOfficialImageFixture, type OfficialImageFixture } from "./fixture";
import { listJuryPublicProfiles, type JuryPublicProfile } from "./juries";
import { DRAFT_MODEL_NAME, DRAFT_MODEL_VERSION } from "./models";
import { imagePolicyRecord } from "./policy";
import { measureAuditedFiles, VISION_MODEL_NAME, VISION_MODEL_VERSION, type VisionRefusal } from "./vision";
import { aggregateWinners, type WinnerAggregate } from "./winners";

export type StageBReport = {
  cut: "2026-11-05-B";
  policy: typeof imagePolicyRecord;
  liveCrawl: false;
  stageA: "fixture_only_not_done";
  marketplace: false;
  externalVisionCalled: false;
  model: {
    vision: typeof VISION_MODEL_NAME;
    visionVersion: typeof VISION_MODEL_VERSION;
    draft: typeof DRAFT_MODEL_NAME;
    draftVersion: typeof DRAFT_MODEL_VERSION;
    externalVisionCalled: false;
  };
  winners: WinnerAggregate[];
  juries: JuryPublicProfile[];
  cache: ImageAudit[];
  visionRefusals: VisionRefusal[];
  statements: ResearchStatement[];
  columns: {
    fact: ResearchStatement[];
    hypothesis: ResearchStatement[];
  };
};

export function buildStageBReport(input?: {
  years?: number[];
  cacheRoot?: string;
  fixture?: OfficialImageFixture;
  analyzedAt?: string;
}): StageBReport {
  const years = input?.years ?? [2025, 2026];
  const fixture = input?.fixture ?? loadOfficialImageFixture();
  const winners = aggregateWinners({ fixture }).filter((item) => years.includes(item.editionYear));
  const juries = listJuryPublicProfiles().filter((item) => years.includes(item.editionYear));
  const cache = readImageAudits(input?.cacheRoot).filter((item) => winners.some((winner) => winner.fixtureId === item.workId));
  const allowed = new Set(fixture.images.map((item) => item.sourceUrl));
  const visionRefusals: VisionRefusal[] = [];
  const usable = cache.filter((item) => {
    if (!allowed.has(item.sourceUrl)) {
      visionRefusals.push({ workId: item.workId, sourceUrl: item.sourceUrl, reason: "来源 URL 不在本 cut 的官方图像 fixture 里，不进入视觉读取。" });
      return false;
    }
    return true;
  });
  const vision = measureAuditedFiles(usable);
  const statements = buildResearchDraft({
    winners,
    juries,
    measurements: vision.measurements,
    analyzedAt: input?.analyzedAt ?? new Date().toISOString(),
  });
  return {
    cut: "2026-11-05-B",
    policy: imagePolicyRecord,
    liveCrawl: false,
    stageA: "fixture_only_not_done",
    marketplace: false,
    externalVisionCalled: false,
    model: {
      vision: VISION_MODEL_NAME,
      visionVersion: VISION_MODEL_VERSION,
      draft: DRAFT_MODEL_NAME,
      draftVersion: DRAFT_MODEL_VERSION,
      externalVisionCalled: false,
    },
    winners,
    juries,
    cache: usable,
    visionRefusals: [...visionRefusals, ...vision.refusals],
    statements,
    columns: {
      fact: statements.filter((item) => item.kind === "fact"),
      hypothesis: statements.filter((item) => item.kind === "hypothesis"),
    },
  };
}

export async function runStageB(input: {
  years: number[];
  cacheRoot?: string;
  fixture?: OfficialImageFixture;
  fetchImpl?: typeof fetch;
  now?: string;
  force?: boolean;
  injectFailureWorkId?: string | null;
}) {
  const downloaded = await downloadOfficialImages({
    cacheRoot: input.cacheRoot,
    years: input.years,
    fixture: input.fixture,
    fetchImpl: input.fetchImpl,
    now: input.now,
    force: input.force,
    injectFailureWorkId: input.injectFailureWorkId,
  });
  const report = buildStageBReport({
    years: input.years,
    cacheRoot: input.cacheRoot,
    fixture: input.fixture,
    analyzedAt: input.now,
  });
  const itemErrors = [
    ...downloaded.failures.map((item) => `${item.workId} ${item.sourceUrl} ${item.error}`),
    ...report.visionRefusals
      .filter((item) => item.workId && downloaded.audits.some((audit) => audit.workId === item.workId))
      .map((item) => `${item.workId} ${item.sourceUrl ?? ""} ${item.reason}`),
  ];
  const downloadStatus: "failed" | "passed" = downloaded.failures.length ? "failed" : "passed";
  const visionStatus: "failed" | "passed" = report.visionRefusals.some((item) => item.workId && downloaded.audits.some((audit) => audit.workId === item.workId))
    ? "failed"
    : "passed";
  const stages = [
    {
      stage: "policy",
      status: "passed" as const,
      summary: `图像策略 C。红线确认于 ${imagePolicyRecord.confirmedAt}。下载必须留下来源 URL 和下载时间。不发布 Marketplace。`,
    },
    {
      stage: "aggregate_winners",
      status: "passed" as const,
      summary: `从 Stage A 种子汇总 ${report.winners.length} 条获奖记录。live crawl 未运行，Stage A 不标成完成。`,
    },
    {
      stage: "jury_profiles",
      status: "passed" as const,
      summary: `正式评委公开资料 ${report.juries.length} 条。教育背景、出版物、访谈保持为空，不补写履历。`,
    },
    {
      stage: "download_images",
      status: downloadStatus,
      summary: `审计入库 ${downloaded.audits.length} 张，失败 ${downloaded.failures.length} 张，跳过 ${downloaded.skipped.length} 张（fixture 没有导出 URL）。`,
    },
    {
      stage: "vision_analysis",
      status: visionStatus,
      summary:
        visionStatus === "passed"
          ? `视觉读取只用审计缓存。测量 ${report.statements.filter((item) => item.kind === "fact" && item.topic === "vision_measurement").length} 条。外部视觉模型没有调用。`
          : "有审计图未能读取。无来源或摘要不符的文件不会进入测量。",
    },
    {
      stage: "draft_report",
      status: "passed" as const,
      summary: `事实 ${report.columns.fact.length} 条，假设 ${report.columns.hypothesis.length} 条。假设不标成官方事实。`,
    },
  ];
  return {
    status: itemErrors.length ? ("failed" as const) : ("succeeded" as const),
    stage: itemErrors.length ? "有失败项，见错误记录" : "阶段 B 草稿已生成",
    total: stages.length,
    completed: stages.filter((item) => item.status === "passed").length,
    failed: itemErrors.length,
    currentItem: downloaded.failures[0]?.workId ?? null,
    errorLog: itemErrors,
    stages,
    report,
    downloaded,
  };
}
