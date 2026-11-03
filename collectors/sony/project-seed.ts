import { database } from "../../src/lib/data/seed";
import type { FactField, RawObservation } from "../types";

export function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function winnerKey(year: number, track: string, rawCategory: string) {
  return `winner:${year}:${track}:${slug(rawCategory)}`;
}

export type WorkFacts = {
  year: 2025 | 2026;
  workId: string;
  entityKey: string;
  entityLabel: string;
  values: Record<
    Extract<
      FactField,
      "winner.title" | "winner.photographer" | "winner.category" | "winner.award" | "winner.image_url" | "winner.rights"
    >,
    string | null
  >;
  sources: {
    title: string;
    photographer: string;
    work: string;
  };
};

function awardText(workId: string, form: "series" | "single") {
  const links = database.awardLinks.filter((link) => (form === "series" ? link.seriesId === workId : link.photographId === workId));
  const awards = [];
  for (const link of links) {
    const award = database.awards.find((item) => item.id === link.awardId);
    if (award) awards.push(award);
  }
  return awards
    .sort((left, right) => left.rank - right.rank || left.name.localeCompare(right.name))
    .map((award) => award.name)
    .join(" · ");
}

export function readWorkFacts(workId: string): WorkFacts | null {
  const series = database.series.find((item) => item.id === workId);
  const photo = database.photographs.find((item) => item.id === workId && item.role === "standalone");
  const work = series
    ? {
        id: series.id,
        title: series.title,
        photographerIds: series.photographerIds,
        categoryId: series.categoryId,
        editionId: series.editionId,
        sourceId: series.provenance.sourceId,
        imageAssetId: series.imageAssetId,
        form: "series" as const,
      }
    : photo
      ? {
          id: photo.id,
          title: photo.title,
          photographerIds: photo.photographerIds,
          categoryId: photo.categoryId,
          editionId: photo.editionId,
          sourceId: photo.provenance.sourceId,
          imageAssetId: photo.imageAssetId,
          form: "single" as const,
        }
      : null;
  if (!work) return null;
  const edition = database.editions.find((item) => item.id === work.editionId);
  const category = database.categories.find((item) => item.id === work.categoryId);
  if (!edition || !category || (edition.year !== 2025 && edition.year !== 2026)) return null;
  const people = work.photographerIds
    .map((id) => database.photographers.find((person) => person.id === id) ?? null)
    .filter((person): person is NonNullable<typeof person> => Boolean(person));
  const photographerSource = people.every((person) => person.provenance.sourceId === people[0]?.provenance.sourceId)
    ? (people[0]?.provenance.sourceId ?? work.sourceId)
    : work.sourceId;
  const asset = database.imageAssets.find((item) => item.id === work.imageAssetId);
  return {
    year: edition.year,
    workId: work.id,
    entityKey: winnerKey(edition.year, category.normalizedTrack, category.rawName),
    entityLabel: `${edition.year} · ${category.rawName} · ${work.title ?? "标题未采集"}`,
    values: {
      "winner.title": work.title,
      "winner.photographer": people.map((person) => person.name).join("、"),
      "winner.category": category.rawName,
      "winner.award": awardText(work.id, work.form),
      "winner.image_url": asset?.officialImageUrl ?? null,
      "winner.rights": asset?.rightsStatus ?? "rights_blocked",
    },
    sources: {
      title: work.sourceId,
      photographer: photographerSource,
      work: work.sourceId,
    },
  };
}

function pushWork(rows: RawObservation[], facts: WorkFacts) {
  const fieldSource: Record<keyof WorkFacts["values"], string> = {
    "winner.title": facts.sources.title,
    "winner.photographer": facts.sources.photographer,
    "winner.category": facts.sources.work,
    "winner.award": facts.sources.work,
    "winner.image_url": facts.sources.work,
    "winner.rights": facts.sources.work,
  };
  for (const field of Object.keys(fieldSource) as (keyof WorkFacts["values"])[]) {
    rows.push({
      editionYear: facts.year,
      entityKey: facts.entityKey,
      entityLabel: facts.entityLabel,
      field,
      value: facts.values[field],
      sourceId: fieldSource[field],
      workId: facts.workId,
      note: "种子中该字段已登记的来源。采集器不补写空标题，也不保存原图。",
    });
  }
}

export function projectSeedObservations(year: 2025 | 2026): RawObservation[] {
  const edition = database.editions.find((item) => item.id === `swpa-${year}`);
  if (!edition) return [];
  const rows: RawObservation[] = [
    {
      editionYear: year,
      entityKey: `edition:${year}`,
      entityLabel: edition.officialLabel,
      field: "edition.year",
      value: String(edition.year),
      sourceId: edition.provenance.sourceId,
      note: "届次记录上的年份。",
    },
    {
      editionYear: year,
      entityKey: `edition:${year}`,
      entityLabel: edition.officialLabel,
      field: "edition.label",
      value: edition.officialLabel,
      sourceId: edition.provenance.sourceId,
      note: "届次官方名称只登记在这一条来源上，其他页面标题并不等于这个字符串。",
    },
  ];

  const workIds = [
    ...database.series.filter((item) => item.editionId === edition.id).map((item) => item.id),
    ...database.photographs
      .filter((item) => item.editionId === edition.id && item.role === "standalone")
      .map((item) => item.id),
  ];
  for (const workId of workIds) {
    const facts = readWorkFacts(workId);
    if (facts) pushWork(rows, facts);
  }

  for (const assignment of database.juryAssignments.filter((item) => item.editionId === edition.id)) {
    const jury = database.juries.find((item) => item.id === assignment.juryId);
    if (!jury) continue;
    const entityKey = `jury:${year}:${jury.id}`;
    const entityLabel = `${year} 评委 ${jury.name}`;
    rows.push({
      editionYear: year,
      entityKey,
      entityLabel,
      field: "jury.name",
      value: jury.name,
      sourceId: assignment.provenance.sourceId,
      juryId: jury.id,
      note: "评委姓名来自该届职务记录的来源页。",
    });
    rows.push({
      editionYear: year,
      entityKey,
      entityLabel,
      field: "jury.role",
      value: assignment.roleTitle,
      sourceId: assignment.provenance.sourceId,
      juryId: jury.id,
      note: "职务只取该来源写下的句子，不从另一页改写。",
    });
  }

  return rows;
}
