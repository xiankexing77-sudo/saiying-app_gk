import { sources } from "../src/lib/data/sources";
import { crossValidate, normalizeFactValue, summarize } from "./cross-validate";
import { assertSafePublicUrl } from "./safety";
import { roleForSource } from "./source-role";
import { corroboratingObservations } from "./sony/corroboration";
import { projectSeedObservations } from "./sony/project-seed";
import type { EditionCollection, FetchPolicy, RawObservation, SourceObservation } from "./types";

const FETCH_POLICY: FetchPolicy = {
  network: false,
  robots: "not_contacted",
  loginBypass: false,
  storesImageBinaries: false,
  ssrfChecked: true,
};

const byId = new Map(sources.map((source) => [source.id, source]));

function hydrate(raw: RawObservation): SourceObservation {
  const source = byId.get(raw.sourceId);
  if (!source) throw new Error(`未知来源 ${raw.sourceId}`);
  assertSafePublicUrl(source.url);
  if (raw.field === "winner.image_url" && raw.value !== null) {
    assertSafePublicUrl(raw.value);
  }
  if (raw.field === "winner.rights" && raw.value !== "rights_blocked") {
    throw new Error(`未经授权不能保存或展示原图：${raw.value ?? "空"}`);
  }
  return {
    ...raw,
    sourceUrl: source.url,
    sourcePageTitle: source.pageTitle,
    fetchedAt: source.fetchedAt,
    contentHash: source.contentHash,
    parserVersion: source.parserVersion,
    extractionVersion: source.extractionVersion,
    publisher: source.publisher,
    role: roleForSource(source),
  };
}

function dedupe(observations: SourceObservation[]) {
  const seen = new Set<string>();
  const kept: SourceObservation[] = [];
  for (const observation of observations) {
    const key = [
      observation.editionYear,
      observation.entityKey,
      observation.field,
      observation.sourceId,
      normalizeFactValue(observation.value) ?? "",
    ].join("\u0000");
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(observation);
  }
  return kept;
}

/**
 * 多来源采集。每个来源先独立抽出事实和来源元数据，再交叉验证。
 * Collector 不推断审美，也不用一致结果覆盖冲突原文。
 * 当前没有 live HTTP：输入是已登记来源上的夹具摘录。
 */
export function collectEdition(year: number): EditionCollection {
  if (year !== 2025 && year !== 2026) {
    throw new Error("首期只交叉验证 2025 与 2026。");
  }
  const observations = dedupe(
    [...projectSeedObservations(year), ...corroboratingObservations(year)].map(hydrate),
  );
  const fields = crossValidate(observations);
  const counts = new Map<string, number>();
  for (const observation of observations) {
    counts.set(observation.sourceId, (counts.get(observation.sourceId) ?? 0) + 1);
  }
  const sourceRows = [...counts.keys()]
    .map((id) => {
      const source = byId.get(id);
      if (!source) throw new Error(`未知来源 ${id}`);
      return {
        id: source.id,
        url: source.url,
        pageTitle: source.pageTitle,
        role: roleForSource(source),
        publisher: source.publisher,
        observationCount: counts.get(id) ?? 0,
      };
    })
    .sort((left, right) => left.role.localeCompare(right.role) || left.id.localeCompare(right.id));

  return {
    editionId: `swpa-${year}`,
    editionYear: year,
    collectionMode: "fixture_multi_source",
    validatorVersion: "cross-validate-1",
    network: false,
    fetchPolicy: FETCH_POLICY,
    sources: sourceRows,
    observations,
    fields,
    summary: summarize(fields, sourceRows.length, observations.length),
  };
}

export function collectCompetition(years: number[] = [2025, 2026]) {
  const editions = [...new Set(years)].sort().map((year) => collectEdition(year));
  const summary = editions.reduce(
    (total, edition) => ({
      agree: total.agree + edition.summary.agree,
      conflict: total.conflict + edition.summary.conflict,
      singleSource: total.singleSource + edition.summary.singleSource,
      sources: total.sources + edition.summary.sources,
      observations: total.observations + edition.summary.observations,
    }),
    { agree: 0, conflict: 0, singleSource: 0, sources: 0, observations: 0 },
  );
  return {
    competitionId: "swpa",
    collectionMode: "fixture_multi_source" as const,
    network: false as const,
    fetchPolicy: FETCH_POLICY,
    editions,
    summary,
  };
}

export function collectEditionById(id: string) {
  if (id === "swpa-2025") return collectEdition(2025);
  if (id === "swpa-2026") return collectEdition(2026);
  return null;
}
