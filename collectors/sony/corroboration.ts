import { database } from "../../src/lib/data/seed";
import type { FactField, RawObservation } from "../types";
import { readWorkFacts, type WorkFacts } from "./project-seed";

const WINNER_FIELDS = [
  "winner.title",
  "winner.photographer",
  "winner.category",
  "winner.award",
  "winner.image_url",
  "winner.rights",
] as const satisfies readonly (keyof WorkFacts["values"])[];

/**
 * 第二来源摘录。只复述种子里已经核对过的字段，或种子姓名备注里写明的另一种拼写。
 * 不访问网络，不把缺失标题补成新事实。
 */
function emitWork(
  workId: string,
  sourceId: string,
  note: string,
  options?: {
    only?: (typeof WINNER_FIELDS)[number][];
    replace?: Partial<Record<(typeof WINNER_FIELDS)[number], string | null>>;
  },
): RawObservation[] {
  const facts = readWorkFacts(workId);
  if (!facts) throw new Error(`未知作品 ${workId}`);
  const fields = options?.only ?? [...WINNER_FIELDS];
  return fields.map((field) => ({
    editionYear: facts.year,
    entityKey: facts.entityKey,
    entityLabel: facts.entityLabel,
    field,
    value: options?.replace && field in options.replace ? (options.replace[field] ?? null) : facts.values[field],
    sourceId,
    workId: facts.workId,
    note,
  }));
}

function juryNameCorroboration(year: 2025 | 2026): RawObservation[] {
  const official = year === 2025 ? "src-judges-2025" : "src-judges-2026";
  const press = year === 2025 ? "src-press-eu-2025-jury" : "src-press-eu-2026-jury";
  const editionId = `swpa-${year}`;
  const rows: RawObservation[] = [];
  for (const assignment of database.juryAssignments.filter((item) => item.editionId === editionId)) {
    const jury = database.juries.find((item) => item.id === assignment.juryId);
    if (!jury) continue;
    for (const sourceId of [official, press]) {
      if (sourceId === assignment.provenance.sourceId) continue;
      rows.push({
        editionYear: year,
        entityKey: `jury:${year}:${jury.id}`,
        entityLabel: `${year} 评委 ${jury.name}`,
        field: "jury.name",
        value: jury.name,
        sourceId,
        juryId: jury.id,
        note: "姓名级互证：官方评委页与 Sony 新闻稿的名单备注。职务不从另一页复制。",
      });
    }
  }
  return rows;
}

function editionYearCorroboration(year: 2025 | 2026): RawObservation[] {
  const sourceIds =
    year === 2025
      ? ["src-overall-2025", "src-judges-2025", "src-press-uk-2025"]
      : ["src-overall-2026", "src-judges-2026", "src-press-my-2026"];
  const edition = database.editions.find((item) => item.year === year);
  return sourceIds
    .filter((sourceId) => sourceId !== edition?.provenance.sourceId)
    .map((sourceId) => ({
      editionYear: year,
      entityKey: `edition:${year}`,
      entityLabel: edition?.officialLabel ?? `SWPA ${year}`,
      field: "edition.year" as FactField,
      value: String(year),
      sourceId,
      note: "年份写在该来源的页面身份里。夹具不把页面标题改写成届次官方名称。",
    }));
}

export function corroboratingObservations(year: 2025 | 2026): RawObservation[] {
  const rows = [...juryNameCorroboration(year), ...editionYearCorroboration(year)];
  if (year === 2025) {
    const note =
      "2025 总冠军页与 Sony 英国新闻稿都记录了同一组已核对字段。图片 URL 为空，采集器不保存原图。";
    rows.push(
      ...emitWork("series-2025-wildlife", "src-overall-2025", note),
      ...emitWork("series-2025-wildlife", "src-press-uk-2025", note),
      {
        editionYear: 2025,
        entityKey: "jury:2025:monica-allende",
        entityLabel: "2025 评委 Monica Allende",
        field: "jury.role",
        value: "Chair of the 2025 Professional jury",
        sourceId: "src-press-uk-2025",
        juryId: "monica-allende",
        note: "英国新闻稿引语的职务署名，与官方评委页的完整职务不是同一句。两边都保留。",
      },
    );
  }
  if (year === 2026) {
    const overallNote =
      "Sony 马来西亚新闻稿注明与主办方公布的 2026 总冠军互证。官方总冠军页记录同一组已核对字段。不发起 HTTP，不保存原图。";
    rows.push(
      ...emitWork("single-2026-portraiture", "src-overall-2026", overallNote),
      ...emitWork("single-2026-portraiture", "src-press-my-2026", overallNote),
      ...emitWork("single-2026-creative", "src-press-my-2026", "种子姓名备注：博客写作 Siavosh Eljali，Sony 新闻稿表格另见 Siavosh Ejlali。不合并成第三个名字。", {
        only: ["winner.photographer"],
        replace: { "winner.photographer": "Siavosh Ejlali" },
      }),
      ...emitWork(
        "series-2026-creative",
        "src-press-my-2026",
        "种子备注：作品页为 Stories of my Sisters，部分新闻稿为 Stories of My Sisters。大小写不同、字母相同。",
        {
          only: ["winner.title"],
          replace: { "winner.title": "Bilha, Stories of My Sisters" },
        },
      ),
      ...emitWork(
        "series-2026-creative",
        "src-gallery-bilha",
        "作品页标题行包含摄影师姓名，与公布稿使用同一个已核对名字。",
        { only: ["winner.photographer"] },
      ),
    );
  }
  return rows;
}
