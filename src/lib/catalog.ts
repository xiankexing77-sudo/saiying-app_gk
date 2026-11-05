import { buildTrendDimensions } from "../../agents/text-evidence";
import { database } from "./data/seed";
import type {
  Award,
  AwardLink,
  Category,
  ImageAsset,
  Jury,
  NormalizedTrack,
  Photographer,
  Photograph,
  Series,
  SeriesAnalysis,
  SingleImageAnalysis,
  WorkForm,
} from "./data/types";

export const TRACK_LABEL: Record<
  NormalizedTrack,
  { zh: string; normalized: string; rawExample: string }
> = {
  series: {
    zh: "系列作品赛",
    normalized: "Series",
    rawExample: "Professional competition",
  },
  single_image: {
    zh: "单张作品赛",
    normalized: "Single Image",
    rawExample: "Open competition",
  },
  student: { zh: "学生组", normalized: "Student", rawExample: "Student competition" },
  youth: { zh: "青年组", normalized: "Youth", rawExample: "Youth competition" },
};

const TRACKS: NormalizedTrack[] = ["series", "single_image", "student", "youth"];

export function listSources() {
  return database.sources;
}

export function getSource(id: string) {
  return database.sources.find((source) => source.id === id) ?? null;
}

export function getCompetition() {
  return database.competition;
}

export function listEditions() {
  return database.editions;
}

export function getEdition(id: string) {
  return database.editions.find((edition) => edition.id === id) ?? null;
}

export function listTracks(editionId?: string) {
  return database.tracks.filter((track) => !editionId || track.editionId === editionId);
}

export function listCategories(track?: NormalizedTrack) {
  return database.categories.filter((category) => !track || category.normalizedTrack === track);
}

export function getCategory(id: string) {
  return database.categories.find((category) => category.id === id) ?? null;
}

export function editionCategory(editionId: string, categoryId: string) {
  return (
    database.editionCategories.find(
      (row) => row.editionId === editionId && row.categoryId === categoryId,
    ) ?? null
  );
}

export function listPhotographers() {
  return database.photographers;
}

export function photographersByIds(ids: string[]) {
  return ids
    .map((id) => database.photographers.find((person) => person.id === id))
    .filter((person): person is Photographer => Boolean(person));
}

export function getImageAsset(id: string) {
  return database.imageAssets.find((asset) => asset.id === id) ?? null;
}

export function listSeries(editionId?: string) {
  return database.series.filter((item) => !editionId || item.editionId === editionId);
}

export function getSeries(id: string) {
  return database.series.find((item) => item.id === id) ?? null;
}

export function seriesFrames(seriesId: string) {
  return database.seriesImages
    .filter((link) => link.seriesId === seriesId)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map((link) => ({
      ...link,
      photograph: database.photographs.find((photo) => photo.id === link.photographId) ?? null,
    }));
}

export function listPhotographs(editionId?: string) {
  return database.photographs.filter((photo) => !editionId || photo.editionId === editionId);
}

export function getPhotograph(id: string) {
  return database.photographs.find((photo) => photo.id === id) ?? null;
}

export function awardsFor(target: { seriesId?: string; photographId?: string }) {
  return database.awardLinks
    .filter((link) =>
      target.seriesId ? link.seriesId === target.seriesId : link.photographId === target.photographId,
    )
    .map((link) => ({ link, award: database.awards.find((award) => award.id === link.awardId) ?? null }))
    .filter((row): row is { link: AwardLink; award: Award } => Boolean(row.award));
}

export function listJuries() {
  return database.juries;
}

export function getJury(id: string) {
  return database.juries.find((jury) => jury.id === id) ?? null;
}

export function juryAssignments(juryId?: string, editionId?: string) {
  return database.juryAssignments.filter(
    (row) => (!juryId || row.juryId === juryId) && (!editionId || row.editionId === editionId),
  );
}

export function personalWorks(juryId: string) {
  return database.personalWorks.find((row) => row.subjectId === juryId) ?? null;
}

export function personalWorkSummary() {
  const ready = database.personalWorks.filter((row) => row.groups.length >= 3);
  return {
    jurors: database.personalWorks.length,
    ready: ready.length,
    insufficient: database.personalWorks.length - ready.length,
  };
}

export function juryProfile(juryId: string) {
  return {
    facts: database.juryFacts.find((row) => row.juryId === juryId) ?? null,
    inference: database.juryInferences.find((row) => row.juryId === juryId) ?? null,
    portfolios: database.juryPortfolios.filter((row) => row.juryId === juryId),
    personalWorks: personalWorks(juryId),
  };
}

export function singleAnalysis(photographId: string) {
  return database.singleAnalyses.find((row) => row.photographId === photographId) ?? null;
}

export function seriesAnalysis(seriesId: string) {
  return database.seriesAnalyses.find((row) => row.seriesId === seriesId) ?? null;
}

export function listHonors(editionId?: string) {
  return database.honors.filter((honor) => !editionId || honor.editionId === editionId);
}

export type LibraryItem = {
  id: string;
  href: string;
  form: WorkForm;
  title: string | null;
  year: number;
  editionId: string;
  track: NormalizedTrack;
  rawTrack: string;
  normalizedLabel: string;
  categoryId: string;
  rawCategory: string;
  photographers: Photographer[];
  awards: string[];
  rightsStatus: ImageAsset["rightsStatus"];
  description: string | null;
};

export function listLibrary(): LibraryItem[] {
  const seriesItems = database.series.map((item) => toLibrarySeries(item));
  const singles = database.photographs
    .filter((photo) => photo.role === "standalone")
    .map((photo) => toLibraryPhoto(photo));
  return [...seriesItems, ...singles].sort((a, b) => a.year - b.year || a.rawCategory.localeCompare(b.rawCategory));
}

function toLibrarySeries(item: Series): LibraryItem {
  const category = getCategory(item.categoryId);
  const edition = getEdition(item.editionId);
  const track = database.tracks.find(
    (row) => row.editionId === item.editionId && row.normalizedTrack === category?.normalizedTrack,
  );
  return {
    id: item.id,
    href: `/series/${item.id}`,
    form: "series",
    title: item.title,
    year: edition?.year ?? 0,
    editionId: item.editionId,
    track: category?.normalizedTrack ?? "series",
    rawTrack: track?.rawName ?? "",
    normalizedLabel: track?.normalizedLabel ?? "",
    categoryId: item.categoryId,
    rawCategory: category?.rawName ?? "",
    photographers: photographersByIds(item.photographerIds),
    awards: awardsFor({ seriesId: item.id }).map((row) => row.award.name),
    rightsStatus: getImageAsset(item.imageAssetId)?.rightsStatus ?? "rights_blocked",
    description: item.description,
  };
}

function toLibraryPhoto(photo: Photograph): LibraryItem {
  const category = getCategory(photo.categoryId);
  const edition = getEdition(photo.editionId);
  const track = database.tracks.find(
    (row) => row.editionId === photo.editionId && row.normalizedTrack === category?.normalizedTrack,
  );
  return {
    id: photo.id,
    href: `/photographs/${photo.id}`,
    form: "single",
    title: photo.title,
    year: edition?.year ?? 0,
    editionId: photo.editionId,
    track: category?.normalizedTrack ?? "single_image",
    rawTrack: track?.rawName ?? "",
    normalizedLabel: track?.normalizedLabel ?? "",
    categoryId: photo.categoryId,
    rawCategory: category?.rawName ?? "",
    photographers: photographersByIds(photo.photographerIds),
    awards: awardsFor({ photographId: photo.id }).map((row) => row.award.name),
    rightsStatus: getImageAsset(photo.imageAssetId)?.rightsStatus ?? "rights_blocked",
    description: photo.description,
  };
}

export type ComparisonRow = {
  categoryId: string;
  rawCategory: string;
  left: LibraryItem | null;
  right: LibraryItem | null;
};

export function compareEditions(track: NormalizedTrack, categoryId?: string) {
  const leftEdition = "swpa-2025";
  const rightEdition = "swpa-2026";
  const leftTrack = database.tracks.find((row) => row.editionId === leftEdition && row.normalizedTrack === track);
  const rightTrack = database.tracks.find((row) => row.editionId === rightEdition && row.normalizedTrack === track);
  if (!leftTrack || !rightTrack) {
    return { ok: false as const, reason: "两届都缺少该规范化赛制，不能比较。" };
  }
  if (leftTrack.workForm !== rightTrack.workForm) {
    return { ok: false as const, reason: "作品形态不同，不能直接比较。" };
  }
  const categories = listCategories(track).filter((category) => !categoryId || category.id === categoryId);
  const library = listLibrary().filter((item) => item.track === track);
  const rows: ComparisonRow[] = categories.map((category) => ({
    categoryId: category.id,
    rawCategory: category.rawName,
    left: library.find((item) => item.editionId === leftEdition && item.categoryId === category.id) ?? null,
    right: library.find((item) => item.editionId === rightEdition && item.categoryId === category.id) ?? null,
  }));
  const dimensions = buildTrendDimensions(
    rows.flatMap((row) => {
      const pair: { year: 2025 | 2026; item: LibraryItem | null }[] = [
        { year: 2025, item: row.left },
        { year: 2026, item: row.right },
      ];
      return pair
        .filter((entry): entry is { year: 2025 | 2026; item: LibraryItem } => Boolean(entry.item))
        .map((entry) => ({
          year: entry.year,
          workId: entry.item.id,
          title: entry.item.title,
          analysis: analysisForLibraryItem(entry.item),
        }));
    }),
  );
  const quoted = dimensions.some((dimension) => dimension.status === "text_quoted");
  return {
    ok: true as const,
    track,
    workForm: leftTrack.workForm,
    rawNames: { 2025: leftTrack.rawName, 2026: rightTrack.rawName },
    rows,
    inference: {
      kind: "inference" as const,
      pixelTrend: "not_generated" as const,
      status: quoted ? ("text_quoted" as const) : ("not_generated" as const),
      reason: "没有读取像素。跨届只对照同一规范化赛制里、官方说明原句已经写到的维度。没写到的维度保持未生成。",
      dimensions,
    },
  };
}

function analysisForLibraryItem(item: LibraryItem): SingleImageAnalysis | SeriesAnalysis | null {
  return item.form === "series" ? seriesAnalysis(item.id) : singleAnalysis(item.id);
}

export function textEvidenceCounts() {
  const rows = [...database.singleAnalyses, ...database.seriesAnalyses];
  return {
    grounded: rows.filter((row) => row.status === "text_grounded").length,
    insufficient: rows.filter((row) => row.status === "insufficient_text").length,
    pixelsRead: rows.filter((row) => row.pixelsRead).length,
  };
}

export function assertComparable(leftTrack: NormalizedTrack, rightTrack: NormalizedTrack) {
  if (leftTrack !== rightTrack) {
    throw new Error("不同赛制不能直接比较");
  }
}

export function dashboardStats() {
  const library = listLibrary();
  return {
    competitions: 1,
    editions: database.editions.length,
    works: library.length,
    series: library.filter((item) => item.form === "series").length,
    singles: library.filter((item) => item.form === "single").length,
    frames: database.photographs.filter((photo) => photo.role === "series_frame").length,
    juries: database.juries.length,
    juriesWithStyleTags: database.juryInferences.filter((row) => row.sampleStatus === "sufficient").length,
    analysesComplete: [...database.singleAnalyses, ...database.seriesAnalyses].filter((row) => row.status === "text_grounded").length,
    analysesInsufficient: [...database.singleAnalyses, ...database.seriesAnalyses].filter((row) => row.status === "insufficient_text").length,
    analysesTemplate: database.singleAnalyses.length + database.seriesAnalyses.length,
    blockedTasks: database.tasks.filter((task) => task.status === "blocked" || task.status === "failed").length,
    runningTasks: database.tasks.filter((task) => task.status === "running" || task.status === "queued").length,
  };
}

export function editionSnapshot(editionId: string) {
  const edition = getEdition(editionId);
  if (!edition) return null;
  const tracks = listTracks(editionId);
  const works = listLibrary().filter((item) => item.editionId === editionId);
  return {
    edition,
    tracks,
    works,
    juries: juryAssignments(undefined, editionId).map((assignment) => ({
      assignment,
      jury: getJury(assignment.juryId) as Jury,
    })),
    honors: listHonors(editionId),
    byTrack: TRACKS.map((track) => ({
      track,
      count: works.filter((item) => item.track === track).length,
    })),
  };
}

const SINGLE_FIELDS = ["subjectScene", "composition", "light", "color", "spatialDepth", "mood", "narrative", "theme", "technique"] as const;
const SERIES_FIELDS = ["visualUnity", "imageRelations", "themeDevelopment"] as const;

function evidenceStaysInsideSource(row: SingleImageAnalysis | SeriesAnalysis) {
  if (row.pixelsRead) return false;
  if (row.schema === "single_image") {
    if (row.basicDescription !== null || row.visualWeight !== null || row.uniqueness !== null) return false;
  } else if (row.narrativeCoherence !== null || row.pacing !== null || row.completeness !== null) {
    return false;
  }
  const source =
    row.schema === "single_image" ? (getPhotograph(row.photographId)?.description ?? "") : (getSeries(row.seriesId)?.description ?? "");
  if (row.evidence.some((item) => item.quote.includes("The jury applauded"))) return false;
  if (row.evidence.some((item) => !source.includes(item.quote))) return false;
  const fields = row.schema === "single_image" ? SINGLE_FIELDS : SERIES_FIELDS;
  const read = (field: string) => {
    const value = (row as unknown as Record<string, unknown>)[field];
    return typeof value === "string" ? value : null;
  };
  if (row.status === "insufficient_text") {
    return (
      row.evidence.length === 0 &&
      row.confidence === null &&
      row.modelName === null &&
      row.analyzedAt === null &&
      fields.every((field) => read(field) === null)
    );
  }
  if (row.modelName !== "pji-text-evidence" || row.confidence === null || row.confidence > 0.55) return false;
  return fields.every((field) => {
    const value = read(field);
    const labels = row.evidence.filter((item) => item.dimension === field).map((item) => item.label);
    if (!value) return labels.length === 0;
    return value.split("；").every((label) => labels.includes(label));
  });
}

export type QualityCheck = { name: string; ok: boolean; detail: string };

export function qualityReport(): { ok: boolean; checks: QualityCheck[] } {
  const checks: QualityCheck[] = [];
  const years = database.editions.map((edition) => edition.year);
  checks.push({
    name: "届次只有 2025 与 2026",
    ok: years.length === 2 && years.includes(2025) && years.includes(2026) && !years.includes(2027),
    detail: years.join(", "),
  });
  for (const edition of database.editions) {
    const names = listTracks(edition.id).map((track) => track.normalizedTrack);
    checks.push({
      name: `${edition.year} 四个比赛体系`,
      ok: TRACKS.every((track) => names.includes(track)),
      detail: names.join(", "),
    });
    checks.push({
      name: `${edition.year} 保留官方赛制原文`,
      ok: listTracks(edition.id).some((track) => track.rawName === "Professional competition") &&
        listTracks(edition.id).some((track) => track.rawName === "Open competition"),
      detail: listTracks(edition.id)
        .map((track) => `${track.rawName} → ${track.normalizedLabel}`)
        .join("；"),
    });
  }
  const library = listLibrary();
  checks.push({
    name: "每条获奖记录都有来源 URL",
    ok: library.every((item) => {
      const record = item.form === "series" ? getSeries(item.id) : getPhotograph(item.id);
      return Boolean(record?.provenance.sourceUrl);
    }),
    detail: `${library.length} 条`,
  });
  checks.push({
    name: "没有托管原图",
    ok: database.imageAssets.every((asset) => asset.hostedBinary === false && asset.rightsStatus === "rights_blocked"),
    detail: `${database.imageAssets.length} 条图片资源`,
  });
  checks.push({
    name: "不足 3 组本人作品时不填写风格",
    ok: database.juryInferences.every((row) => {
      const groups = personalWorks(row.juryId)?.groups.length ?? 0;
      if (groups >= 3) return true;
      return (
        row.kind === "inference" &&
        row.sampleStatus === "insufficient" &&
        row.sampleCount === groups &&
        row.visualStyle === null &&
        row.colorTendency === null &&
        row.compositionTendency === null &&
        row.narrativePreference === null &&
        row.thematicMode === null &&
        row.commonSubjects === null &&
        row.confidence === null &&
        row.styleTags.length === 0
      );
    }),
    detail: `${database.juryInferences.length} 份画像`,
  });
  checks.push({
    name: "满 3 组才生成带证据的风格标签",
    ok: database.juryInferences.every((row) => {
      const groups = personalWorks(row.juryId)?.groups ?? [];
      if (groups.length < 3) return row.styleTags.length === 0;
      const cross = row.styleTags.filter((tag) => tag.scope === "cross_group");
      return (
        row.sampleStatus === "sufficient" &&
        row.styleTags.length > 0 &&
        row.styleTags.every(
          (tag) =>
            tag.evidence.length > 0 &&
            tag.evidence.every((item) => groups.some((group) => group.id === item.groupId)) &&
            tag.modelName === "pji-style-tags" &&
            tag.modelVersion !== null &&
            tag.confidence <= 0.7 &&
            tag.sampleCount === tag.groupIds.length,
        ) &&
        cross.every((tag) => tag.sampleCount >= 2) &&
        row.styleTags.filter((tag) => tag.scope === "single_group").every((tag) => tag.sampleCount === 1) &&
        (cross.some((tag) => tag.dimension === "color") ? row.colorTendency !== null : row.colorTendency === null) &&
        (cross.some((tag) => tag.dimension === "visual_style") ? row.visualStyle !== null : row.visualStyle === null)
      );
    }),
    detail: personalWorkSummary().ready + " 位达到 3 组",
  });
  const keys = database.awardLinks.map(
    (link) => `${link.awardId}|${link.seriesId ?? link.photographId}|${[...link.photographerIds].sort().join("+")}`,
  );
  checks.push({
    name: "获奖记录去重键唯一",
    ok: new Set(keys).size === keys.length,
    detail: `${keys.length} 条`,
  });
  const bilha = getSeries("series-2026-creative");
  const sequences = seriesFrames("series-2026-creative").map((frame) => frame.sequenceNumber);
  checks.push({
    name: "Bilha 系列画幅顺序唯一",
    ok: Boolean(bilha) && new Set(sequences).size === sequences.length && sequences.length === 8,
    detail: sequences.join(", "),
  });
  checks.push({
    name: "单张分析与系列分析 schema 分离",
    ok:
      database.singleAnalyses.every((row) => row.schema === "single_image") &&
      database.seriesAnalyses.every((row) => row.schema === "series"),
    detail: `单张 ${database.singleAnalyses.length} / 系列 ${database.seriesAnalyses.length}`,
  });
  checks.push({
    name: "说明证据能回到原文，未读像素",
    ok: [...database.singleAnalyses, ...database.seriesAnalyses].every((row) => evidenceStaysInsideSource(row)),
    detail: `命中 ${textEvidenceCounts().grounded}，留空 ${textEvidenceCounts().insufficient}`,
  });
  const openArchitecture = library.filter((item) => item.rawCategory === "Architecture");
  const professionalArchitecture = library.filter((item) => item.rawCategory === "Architecture & Design");
  checks.push({
    name: "Open Architecture 与 Professional Architecture & Design 不是同一类别",
    ok:
      openArchitecture.every((item) => item.track === "single_image") &&
      professionalArchitecture.every((item) => item.track === "series") &&
      new Set([...openArchitecture, ...professionalArchitecture].map((item) => item.categoryId)).size === 2,
    detail: "比较接口按 categoryId 配对",
  });
  return { ok: checks.every((check) => check.ok), checks };
}

export function categoryWinners(editionId: string, category: Category) {
  return listLibrary().filter((item) => item.editionId === editionId && item.categoryId === category.id);
}

export function quotesBySpeaker(name: string) {
  return database.series.flatMap((item) =>
    item.publicQuotes
      .filter((quote) => quote.speaker === name)
      .map((quote) => ({ quote, series: item })),
  );
}
