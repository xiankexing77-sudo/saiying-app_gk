import { analyzePhotograph, analyzeSeriesWork } from "../../../agents/text-evidence";
import { database } from "../data/seed";
import type { JuryPublicProfile } from "./juries";
import type { VisionMeasurement } from "./vision";
import type { WinnerAggregate } from "./winners";

export type EvidenceQuote = {
  quote: string;
  sourceUrl: string;
  downloadedAt?: string;
  storagePath?: string;
};

export type FactStatement = {
  id: string;
  kind: "fact";
  column: "fact";
  topic: "official_text" | "vision_measurement" | "jury";
  editionYear: number | null;
  workId: string | null;
  juryId: string | null;
  text: string;
  evidence: EvidenceQuote;
};

export type HypothesisStatement = {
  id: string;
  kind: "hypothesis";
  column: "hypothesis";
  topic: "style" | "subject" | "preference" | "selection";
  editionYear: number | null;
  workId: string | null;
  juryId: null;
  text: string;
  hypothesis: true;
  presentedAsOfficialFact: false;
  groundedIn: string[];
};

export type ResearchStatement = FactStatement | HypothesisStatement;

type TextHit = {
  workId: string;
  editionYear: number;
  name: string | null;
  dimension: string;
  label: string;
  quote: string;
  sourceUrl: string;
};

export function assertStatements(items: ResearchStatement[]) {
  for (const item of items) {
    if (item.kind === "fact") {
      if (!item.evidence.quote.trim() || !item.evidence.sourceUrl.startsWith("https://")) {
        throw new Error(`${item.id} 缺少证据原句或来源 URL`);
      }
      continue;
    }
    if (item.hypothesis !== true || item.presentedAsOfficialFact !== false) {
      throw new Error(`${item.id} 没有标成假设`);
    }
    if (item.groundedIn.length === 0) throw new Error(`${item.id} 没有可追溯依据`);
  }
}

export function buildResearchDraft(input: {
  winners: WinnerAggregate[];
  juries: JuryPublicProfile[];
  measurements: VisionMeasurement[];
  analyzedAt: string;
}): ResearchStatement[] {
  const facts: FactStatement[] = [];
  const hits: TextHit[] = [];
  for (const winner of input.winners) {
    const series = database.series.find((item) => item.id === winner.fixtureId);
    const photo = database.photographs.find((item) => item.id === winner.fixtureId && item.role === "standalone");
    const analysis = series
      ? analyzeSeriesWork(series, input.analyzedAt)
      : photo
        ? analyzePhotograph(photo, input.analyzedAt)
        : null;
    for (const item of analysis?.evidence ?? []) {
      if (!item.quote.trim() || !item.sourceUrl) continue;
      const id = `fact:text:${winner.fixtureId}:${item.dimension}:${item.label}`;
      facts.push({
        id,
        kind: "fact",
        column: "fact",
        topic: "official_text",
        editionYear: winner.editionYear,
        workId: winner.fixtureId,
        juryId: null,
        text: `官方说明写到：${item.label}。`,
        evidence: { quote: item.quote, sourceUrl: item.sourceUrl },
      });
      hits.push({
        workId: winner.fixtureId,
        editionYear: winner.editionYear,
        name: winner.name,
        dimension: item.dimension,
        label: item.label,
        quote: item.quote,
        sourceUrl: item.sourceUrl,
      });
    }
  }

  for (const profile of input.juries) {
    for (const field of profile.fields) {
      if (field.key !== "biographyExcerpt" && field.key !== "roleTitle") continue;
      facts.push({
        id: `fact:jury:${profile.juryId}:${profile.editionYear}:${field.key}`,
        kind: "fact",
        column: "fact",
        topic: "jury",
        editionYear: profile.editionYear,
        workId: null,
        juryId: profile.juryId,
        text: field.key === "roleTitle" ? `${profile.name} 的公开职务。` : `${profile.name} 的公开简介摘录。`,
        evidence: { quote: field.quote, sourceUrl: field.sourceUrl },
      });
    }
  }

  const visionByWork = new Map<string, VisionMeasurement>();
  for (const measurement of input.measurements) {
    if (measurement.kind !== "fact" || !measurement.quote.trim() || !measurement.sourceUrl || !measurement.downloadedAt) continue;
    visionByWork.set(measurement.workId, measurement);
    facts.push({
      id: `fact:vision:${measurement.workId}`,
      kind: "fact",
      column: "fact",
      topic: "vision_measurement",
      editionYear: input.winners.find((item) => item.fixtureId === measurement.workId)?.editionYear ?? null,
      workId: measurement.workId,
      juryId: null,
      text: measurement.pixelsRead ? "视觉测量来自已审计的缓存图。" : "只读到已审计缓存图的容器尺寸，没有解码像素。",
      evidence: {
        quote: measurement.quote,
        sourceUrl: measurement.sourceUrl,
        downloadedAt: measurement.downloadedAt,
        storagePath: measurement.storagePath,
      },
    });
  }

  const hypotheses: HypothesisStatement[] = [];
  const byLabel = new Map<string, TextHit[]>();
  for (const hit of hits) {
    const bucket = byLabel.get(hit.label) ?? [];
    bucket.push(hit);
    byLabel.set(hit.label, bucket);
  }
  for (const [label, group] of byLabel) {
    const ids = group.map((item) => `fact:text:${item.workId}:${item.dimension}:${item.label}`);
    hypotheses.push({
      id: `hyp:style:${label}`,
      kind: "hypothesis",
      column: "hypothesis",
      topic: "style",
      editionYear: group.length === 1 ? group[0].editionYear : null,
      workId: group.length === 1 ? group[0].workId : null,
      juryId: null,
      text: `风格标签（假设）：${label}。依据是官方说明原句，不是主办方公布的风格分类。`,
      hypothesis: true,
      presentedAsOfficialFact: false,
      groundedIn: ids,
    });
  }

  for (const year of [2025, 2026]) {
    const subjects = hits.filter((item) => item.editionYear === year && item.dimension === "subjectScene");
    if (subjects.length) {
      const labels = [...new Set(subjects.map((item) => item.label))];
      hypotheses.push({
        id: `hyp:subject:${year}`,
        kind: "hypothesis",
        column: "hypothesis",
        topic: "subject",
        editionYear: year,
        workId: null,
        juryId: null,
        text: `常见题材（假设）：${year} 已引用的官方说明写到 ${labels.join("、")}。没有写到的题材不补。`,
        hypothesis: true,
        presentedAsOfficialFact: false,
        groundedIn: subjects.map((item) => `fact:text:${item.workId}:${item.dimension}:${item.label}`),
      });
    }
    const counts = new Map<string, TextHit[]>();
    for (const hit of hits.filter((item) => item.editionYear === year)) {
      const bucket = counts.get(hit.label) ?? [];
      bucket.push(hit);
      counts.set(hit.label, bucket);
    }
    const yearHits = hits.filter((item) => item.editionYear === year);
    if (!yearHits.length) continue;
    const repeated = [...counts.entries()].filter((entry) => entry[1].length >= 2).sort((a, b) => b[1].length - a[1].length);
    const [label, group] = repeated[0] ?? [yearHits[0].label, [yearHits[0]]];
    hypotheses.push({
      id: `hyp:preference:${year}`,
      kind: "hypothesis",
      column: "hypothesis",
      topic: "preference",
      editionYear: year,
      workId: null,
      juryId: null,
      text:
        group.length >= 2
          ? `偏好假设：评委公开资料没有写「偏好${label}」。${year} 的获奖说明里这条说法出现 ${group.length} 次，只能当作研究假设，不能写成评委履历或官方评选标准。`
          : `偏好假设：${year} 已引用的说明里没有同一说法出现两次以上。不能从单次原句推断评委偏好，也不能写成履历。`,
      hypothesis: true,
      presentedAsOfficialFact: false,
      groundedIn: group.map((item) => `fact:text:${item.workId}:${item.dimension}:${item.label}`),
    });
  }

  for (const winner of input.winners) {
    const related = facts.filter((item) => item.workId === winner.fixtureId);
    if (!related.length) continue;
    const measurement = visionByWork.get(winner.fixtureId);
    const name = winner.name ?? "标题未采集";
    const frameNote = measurement?.note ? `图像说明：${measurement.note}` : "";
    hypotheses.push({
      id: `hyp:selection:${winner.fixtureId}`,
      kind: "hypothesis",
      column: "hypothesis",
      topic: "selection",
      editionYear: winner.editionYear,
      workId: winner.fixtureId,
      juryId: null,
      text: `可能入选原因（假设）：${name}。可见依据是已引用的官方说明${measurement ? "和已审计缓存图的测量" : ""}，不是评委投票记录，也不是主办方公布的入选理由。${frameNote}`,
      hypothesis: true,
      presentedAsOfficialFact: false,
      groundedIn: related.map((item) => item.id),
    });
  }

  const statements: ResearchStatement[] = [...facts, ...hypotheses];
  assertStatements(statements);
  return statements;
}
