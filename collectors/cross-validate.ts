import { roleLabel, roleRank } from "./source-role";
import type { FieldValidation, FieldVerdict, SourceObservation, ValidationSummary } from "./types";

export function normalizeFactValue(value: string | null) {
  if (value == null) return null;
  const folded = value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
  return folded.length ? folded : null;
}

function byPriority(left: SourceObservation, right: SourceObservation) {
  const rank = roleRank(left.role) - roleRank(right.role);
  if (rank !== 0) return rank;
  return left.sourceId.localeCompare(right.sourceId);
}

function preferredReason(preferred: SourceObservation, verdict: FieldVerdict) {
  const role = roleLabel(preferred.role);
  if (verdict === "conflict") {
    return `来源不一致。展示值取自${role}「${preferred.sourcePageTitle}」，其他来源的原文保留，不覆盖。`;
  }
  if (verdict === "single_source") {
    return `只有这一条来源陈述该字段（${role}）。未经第二来源交叉验证。`;
  }
  return `各来源规范化后一致。展示原文取自优先级更高的${role}「${preferred.sourcePageTitle}」。`;
}

function confidenceFor(verdict: FieldVerdict, observations: SourceObservation[]) {
  if (verdict === "conflict") return { confidence: null, confidenceLabel: "冲突" as const };
  if (verdict === "single_source") return { confidence: null, confidenceLabel: "低" as const };
  if (observations.some((item) => item.role === "official_primary")) {
    return { confidence: 0.92, confidenceLabel: "高" as const };
  }
  return { confidence: 0.75, confidenceLabel: "中" as const };
}

export function crossValidate(observations: SourceObservation[]): FieldValidation[] {
  const groups = new Map<string, SourceObservation[]>();
  for (const observation of observations) {
    const key = `${observation.editionYear}\u0000${observation.entityKey}\u0000${observation.field}`;
    const list = groups.get(key) ?? [];
    list.push(observation);
    groups.set(key, list);
  }

  const fields: FieldValidation[] = [];
  for (const group of groups.values()) {
    const ranked = [...group].sort(byPriority);
    const preferred = ranked[0];
    if (!preferred) continue;
    const distinctSources = new Set(ranked.map((item) => item.sourceId));
    const distinctValues = new Set(ranked.map((item) => normalizeFactValue(item.value) ?? "\u2205"));
    let verdict: FieldVerdict;
    if (distinctValues.size > 1) verdict = "conflict";
    else if (distinctSources.size >= 2) verdict = "agree";
    else verdict = "single_source";
    const preferredNorm = normalizeFactValue(preferred.value);
    const confidence = confidenceFor(verdict, ranked);
    fields.push({
      editionYear: preferred.editionYear,
      entityKey: preferred.entityKey,
      entityLabel: preferred.entityLabel,
      field: preferred.field,
      workId: ranked.find((item) => item.workId)?.workId ?? null,
      juryId: ranked.find((item) => item.juryId)?.juryId ?? null,
      verdict,
      preferredValue: preferred.value,
      preferredSourceId: preferred.sourceId,
      preferredSourceUrl: preferred.sourceUrl,
      preferredSourceTitle: preferred.sourcePageTitle,
      preferredRole: preferred.role,
      preferredReason: preferredReason(preferred, verdict),
      confidence: confidence.confidence,
      confidenceLabel: confidence.confidenceLabel,
      observations: ranked.map((item) => ({
        sourceId: item.sourceId,
        sourceUrl: item.sourceUrl,
        sourcePageTitle: item.sourcePageTitle,
        fetchedAt: item.fetchedAt,
        contentHash: item.contentHash,
        parserVersion: item.parserVersion,
        extractionVersion: item.extractionVersion,
        publisher: item.publisher,
        role: item.role,
        value: item.value,
        agreesWithPreferred: normalizeFactValue(item.value) === preferredNorm,
        note: item.note ?? null,
      })),
    });
  }

  const verdictRank: Record<FieldVerdict, number> = { conflict: 0, agree: 1, single_source: 2 };
  return fields.sort(
    (left, right) =>
      verdictRank[left.verdict] - verdictRank[right.verdict] ||
      left.entityKey.localeCompare(right.entityKey) ||
      left.field.localeCompare(right.field),
  );
}

export function summarize(fields: FieldValidation[], sourceCount: number, observationCount: number): ValidationSummary {
  return {
    agree: fields.filter((field) => field.verdict === "agree").length,
    conflict: fields.filter((field) => field.verdict === "conflict").length,
    singleSource: fields.filter((field) => field.verdict === "single_source").length,
    sources: sourceCount,
    observations: observationCount,
  };
}
