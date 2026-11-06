import { downloadOfficialImages, readImageCache, type ImageAudit } from "./cache";
import { buildResearchDraft, type ResearchStatement } from "./draft";
import { loadOfficialImageFixture, type OfficialImageFixture } from "./fixture";
import { listJuryPublicProfiles, type JuryPublicProfile } from "./juries";
import { DRAFT_MODEL_NAME, DRAFT_MODEL_VERSION } from "./models";
import { imagePolicyRecord, STAGE_B_CUT } from "./policy";
import { classifyIngest, isOfficialFactPixel, withheldReasons, type PublicPixelSource } from "./source";
import { measureAuditedFiles, VISION_MODEL_NAME, VISION_MODEL_VERSION, type VisionMeasurement, type VisionRefusal } from "./vision";
import { aggregateWinners, type WinnerAggregate } from "./winners";

export type WithheldPixel = {
  subjectKind: ImageAudit["subjectKind"];
  subjectId: string;
  workId: string;
  sourceUrl: string;
  pageUrl: string;
  sourceKind: ImageAudit["sourceKind"];
  identityMatch: ImageAudit["identityMatch"];
  rightsStatus: ImageAudit["rightsStatus"];
  downloadedAt: string;
  storagePath: string;
  reasons: Array<"web_other" | "unverified_match" | "rights_unverified">;
  inFactColumn: false;
  presentedAsOfficialFact: false;
  measurementQuote: string | null;
};

export type StageBReport = {
  cut: typeof STAGE_B_CUT;
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
  withheld: WithheldPixel[];
  visionRefusals: VisionRefusal[];
  statements: ResearchStatement[];
  columns: {
    fact: ResearchStatement[];
    hypothesis: ResearchStatement[];
  };
};

function inScope(item: ImageAudit, winners: WinnerAggregate[], juries: JuryPublicProfile[]) {
  if (item.subjectKind === "jury") return Boolean(item.juryId && juries.some((jury) => jury.juryId === item.juryId));
  return winners.some((winner) => winner.fixtureId === item.workId);
}

function measurementKey(item: { subjectKind: string; workId: string; sourceUrl: string }) {
  return `${item.subjectKind}|${item.workId}|${item.sourceUrl}`;
}

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
  const disk = readImageCache(input?.cacheRoot);
  const officialExports = fixture.images.map((item) => ({ workId: item.workId, sourceUrl: item.sourceUrl }));
  const visionRefusals: VisionRefusal[] = disk.unlabeled.map((item) => ({
    workId: item.workId,
    sourceUrl: item.sourceUrl,
    reason: item.reason,
  }));
  const usable: ImageAudit[] = [];
  for (const item of disk.audits) {
    if (!inScope(item, winners, juries)) continue;
    try {
      const labels = classifyIngest({
        subjectKind: item.subjectKind,
        subjectId: item.subjectKind === "jury" ? (item.juryId ?? "") : item.workId,
        sourceUrl: item.sourceUrl,
        officialExports,
      });
      usable.push({ ...item, ...labels });
    } catch (error) {
      visionRefusals.push({
        workId: item.workId,
        sourceUrl: item.sourceUrl,
        reason: error instanceof Error ? error.message : "来源 URL 不是公开网页，不进入视觉读取。",
      });
    }
  }
  const vision = measureAuditedFiles(usable);
  const eligible = vision.measurements.filter((item) => isOfficialFactPixel(item));
  const statements = buildResearchDraft({
    winners,
    juries,
    measurements: eligible,
    analyzedAt: input?.analyzedAt ?? new Date().toISOString(),
  });
  const measured = new Map<string, VisionMeasurement>(vision.measurements.map((item) => [measurementKey(item), item]));
  const withheld: WithheldPixel[] = usable.filter((item) => !isOfficialFactPixel(item)).map((item) => ({
    subjectKind: item.subjectKind,
    subjectId: item.subjectKind === "jury" ? (item.juryId ?? item.workId) : item.workId,
    workId: item.workId,
    sourceUrl: item.sourceUrl,
    pageUrl: item.pageUrl,
    sourceKind: item.sourceKind,
    identityMatch: item.identityMatch,
    rightsStatus: item.rightsStatus,
    downloadedAt: item.downloadedAt,
    storagePath: item.storagePath,
    reasons: withheldReasons(item),
    inFactColumn: false,
    presentedAsOfficialFact: false,
    measurementQuote: measured.get(measurementKey(item))?.quote ?? null,
  }));
  const columns = {
    fact: statements.filter((item) => item.kind === "fact"),
    hypothesis: statements.filter((item) => item.kind === "hypothesis"),
  };
  for (const fact of columns.fact) {
    if (fact.kind !== "fact" || fact.topic !== "vision_measurement") continue;
    const pixel = usable.find((item) => item.workId === fact.workId && item.sourceUrl === fact.evidence.sourceUrl);
    if (!pixel || !isOfficialFactPixel(pixel)) throw new Error(`${fact.id} 把未核实来源写成了官方事实`);
  }
  return {
    cut: STAGE_B_CUT,
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
    withheld,
    visionRefusals: [...visionRefusals, ...vision.refusals],
    statements,
    columns,
  };
}

export async function runStageB(input: {
  years: number[];
  cacheRoot?: string;
  fixture?: OfficialImageFixture;
  publicSources?: PublicPixelSource[];
  fetchImpl?: typeof fetch;
  now?: string;
  force?: boolean;
  injectFailureWorkId?: string | null;
}) {
  const downloaded = await downloadOfficialImages({
    cacheRoot: input.cacheRoot,
    years: input.years,
    fixture: input.fixture,
    publicSources: input.publicSources,
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
    ...downloaded.failures.map((item) => `${item.failureKind} retryable=${item.retryable} ${item.workId} ${item.sourceUrl} ${item.error}`),
    ...report.visionRefusals
      .filter((item) => item.workId && downloaded.audits.some((audit) => audit.workId === item.workId))
      .map((item) => `${item.workId} ${item.sourceUrl ?? ""} ${item.reason}`),
  ];
  const downloadStatus: "failed" | "passed" = downloaded.failures.length ? "failed" : "passed";
  const visionStatus: "failed" | "passed" = report.visionRefusals.some((item) => item.workId && downloaded.audits.some((audit) => audit.workId === item.workId))
    ? "failed"
    : "passed";
  const officialCount = downloaded.audits.filter((item) => item.sourceKind === "official").length;
  const otherCount = downloaded.audits.filter((item) => item.sourceKind === "web_other").length;
  const stages = [
    {
      stage: "policy",
      status: "passed" as const,
      summary: `图像策略 B2（${imagePolicyRecord.cut}）。确认于 ${imagePolicyRecord.confirmedAt}。每张缓存必须有 sourceUrl、downloadedAt、storagePath。web_other、unverified_match、rights_unverified 不写入事实栏。不发布 Marketplace。`,
    },
    {
      stage: "aggregate_winners",
      status: "passed" as const,
      summary: `从 Stage A 种子汇总 ${report.winners.length} 条获奖记录。live crawl 未运行，Stage A 不标成完成。`,
    },
    {
      stage: "jury_profiles",
      status: "passed" as const,
      summary: `正式评委公开资料 ${report.juries.length} 条。评委样本像素只在提交了公开 URL 时下载。教育背景、出版物、访谈保持为空，不补写履历。`,
    },
    {
      stage: "download_images",
      status: downloadStatus,
      summary: `审计入库 ${downloaded.audits.length} 张（official ${officialCount}，web_other ${otherCount}），失败 ${downloaded.failures.length} 张，跳过 ${downloaded.skipped.length} 张。登录或付费失败可重试。`,
    },
    {
      stage: "vision_analysis",
      status: visionStatus,
      summary:
        visionStatus === "passed"
          ? `视觉读取只用带齐审计字段的缓存。官方事实测量 ${report.statements.filter((item) => item.kind === "fact" && item.topic === "vision_measurement").length} 条，另有 ${report.withheld.length} 条未写入事实栏。外部视觉模型没有调用。`
          : "有审计图未能读取。缺少 sourceUrl、downloadedAt 或 storagePath 的文件不会进入测量。",
    },
    {
      stage: "draft_report",
      status: "passed" as const,
      summary: `事实 ${report.columns.fact.length} 条，假设 ${report.columns.hypothesis.length} 条。假设和未核实来源不标成官方事实。`,
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
