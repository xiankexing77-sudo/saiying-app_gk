import type {
  AnalysisEvidence,
  Photograph,
  Series,
  SeriesAnalysis,
  SingleImageAnalysis,
  TextBasis,
} from "../src/lib/data/types";

export const TEXT_MODEL_NAME = "pji-text-evidence";
export const TEXT_MODEL_VERSION = "phrase-1.0.0";

type SingleField = "subjectScene" | "composition" | "light" | "color" | "spatialDepth" | "mood" | "narrative" | "theme" | "technique";

type SeriesField = "visualUnity" | "imageRelations" | "themeDevelopment";

type Rule = {
  field: string;
  label: string;
  phrases: string[];
};

/**
 * 词表只收说明里已经写出的说法。命中才填写对应维度，并保存原句。
 * 没有这些词，就留空。不从标题、组别或评委引语改写。
 */
const SINGLE_RULES: Rule[] = [
  { field: "composition", label: "说明写到广角", phrases: ["very wide angle"] },
  { field: "composition", label: "说明称构图讲究", phrases: ["meticulously composed", "carefully composed"] },
  { field: "composition", label: "说明写到几何", phrases: ["geometric landscape"] },
  { field: "composition", label: "说明写到画面中心", phrases: ["centres on", "centers on"] },
  { field: "spatialDepth", label: "说明写到从上方观看", phrases: ["from above"] },
  { field: "spatialDepth", label: "说明写到远处", phrases: ["in the distance"] },
  { field: "spatialDepth", label: "说明写到层次", phrases: ["revealing layers", "shadows and layers"] },
  { field: "light", label: "黄金时刻", phrases: ["golden hour"] },
  { field: "light", label: "日落", phrases: ["sunset"] },
  { field: "light", label: "剪影", phrases: ["silhouetted"] },
  { field: "light", label: "晨光", phrases: ["early morning glow"] },
  { field: "light", label: "夜景", phrases: ["dark november night"] },
  { field: "light", label: "说明写到阴影", phrases: ["layers of shadows", "utilising the shadows"] },
  { field: "light", label: "说明写到火把", phrases: ["burning torches"] },
  { field: "color", label: "黑白", phrases: ["black-and-white", "black and white"] },
  { field: "color", label: "说明写到鲜艳涂装", phrases: ["brightly painted"] },
  { field: "color", label: "说明写到色彩", phrases: ["colourful", "colorful"] },
  { field: "technique", label: "拼贴", phrases: ["collage"] },
  { field: "subjectScene", label: "时代广场", phrases: ["times square"] },
  { field: "subjectScene", label: "溪流与草地", phrases: ["stream meandering"] },
  { field: "subjectScene", label: "街头摊贩", phrases: ["street vendor"] },
  { field: "subjectScene", label: "北极熊", phrases: ["polar bears"] },
  { field: "subjectScene", label: "风筝", phrases: ["handmade kites"] },
  { field: "subjectScene", label: "卧室", phrases: ["bedroom"] },
  { field: "subjectScene", label: "两个人", phrases: ["two people"] },
  { field: "subjectScene", label: "萨满", phrases: ["shamans"] },
  { field: "subjectScene", label: "球迷与照明弹", phrases: ["lighting flares"] },
  { field: "subjectScene", label: "滑板", phrases: ["skater"] },
  { field: "subjectScene", label: "造纸厂", phrases: ["paper mill"] },
  { field: "subjectScene", label: "沙丘", phrases: ["dunes"] },
  { field: "subjectScene", label: "北极狐", phrases: ["arctic fox"] },
  { field: "subjectScene", label: "暴风雪", phrases: ["blizzard"] },
  { field: "subjectScene", label: "火山岩", phrases: ["volcanic rock"] },
  { field: "subjectScene", label: "一家人看风景", phrases: ["family admiring"] },
  { field: "subjectScene", label: "跃入河中", phrases: ["leaping into the river"] },
  { field: "subjectScene", label: "朋克演出", phrases: ["punk show"] },
  { field: "subjectScene", label: "骑手落马", phrases: ["thrown from their mount"] },
  { field: "subjectScene", label: "消防员运送作品", phrases: ["firefighters transporting art"] },
  { field: "mood", label: "说明称温柔", phrases: ["tender"] },
  { field: "mood", label: "说明称迷人", phrases: ["mesmerising", "mesmerizing"] },
  { field: "mood", label: "说明写到喜悦", phrases: ["elation"] },
  { field: "mood", label: "说明称痛切", phrases: ["poignant"] },
  { field: "narrative", label: "说明写到想呈现另一面", phrases: ["another side of the event"] },
  { field: "narrative", label: "说明写到想留住这一刻", phrases: ["immortalise this moment", "immortalize this moment"] },
  { field: "narrative", label: "说明写到想表达那一刻的能量", phrases: ["raw energy"] },
  { field: "narrative", label: "说明写到摆拍与象征", phrases: ["staged and symbolic"] },
  { field: "narrative", label: "说明写到在记录这一刻", phrases: ["documents the moment"] },
  { field: "theme", label: "说明写到人类对自然的影响", phrases: ["destructive impact on the natural world"] },
  { field: "theme", label: "说明写到模拟环境", phrases: ["simulated environments"] },
  { field: "theme", label: "说明写到伊朗女性", phrases: ["iranian women"] },
  { field: "theme", label: "说明写到女性监狱空间", phrases: ["female prison"] },
  { field: "theme", label: "说明写到社区正在消失", phrases: ["disappearing under concrete"] },
  { field: "theme", label: "说明写到原住民社群", phrases: ["indigenous communities", "indigenous peoples"] },
  { field: "theme", label: "说明写到火灾中抢救作品", phrases: ["following a fire"] },
];

const SERIES_RULES: Rule[] = [
  { field: "imageRelations", label: "说明列出系列里的几类照片", phrases: ["the series consists of photographs"] },
  { field: "themeDevelopment", label: "说明写到系列在探讨的对象", phrases: ["this project explores"] },
  { field: "themeDevelopment", label: "说明写到想通过合作确立先例", phrases: ["seeks to create a precedent"] },
  { field: "themeDevelopment", label: "说明写到原住民社群", phrases: ["indigenous communities"] },
  { field: "themeDevelopment", label: "说明写到六年、四大洲", phrases: ["across four continents"] },
  { field: "themeDevelopment", label: "说明写到模拟环境", phrases: ["simulated environments"] },
  { field: "themeDevelopment", label: "说明写到人类对自然的影响", phrases: ["destructive impact on the natural world"] },
  { field: "themeDevelopment", label: "说明写到社区正在被混凝土取代", phrases: ["disappearing under concrete"] },
  { field: "visualUnity", label: "说明称这一系列是梦幻、诗意的", phrases: ["dreamy, poetic style"] },
];

const OFFICIAL_NOTE =
  "推断。未读取像素，原图权限为 rights_blocked。只在官方说明的原句命中词表时填写维度；没写到的留空。不把说明改写成基础视觉描述，也不采用评委引语。";

const USER_NOTE =
  "推断。这段文字由用户输入，不是赛事官方事实，也没有读取像素。只在原句命中词表时填写维度。这不是比赛结果预测。";

export function findQuote(text: string, phrase: string): string | null {
  const lower = text.toLowerCase();
  const needle = phrase.toLowerCase();
  const index = lower.indexOf(needle);
  if (index < 0) return null;
  let start = 0;
  const prior = Math.max(text.lastIndexOf(". ", index), text.lastIndexOf("! ", index), text.lastIndexOf("? ", index));
  if (prior !== -1) start = prior + 2;
  let end = text.length;
  const next = [".", "!", "?"]
    .map((separator) => text.indexOf(separator, index + needle.length))
    .filter((at) => at !== -1);
  if (next.length) end = Math.min(...next) + 1;
  const quote = text.slice(start, end).trim();
  return quote.length ? quote : null;
}

function collectEvidence(text: string, rules: Rule[], sourceUrl: string | null): AnalysisEvidence[] {
  const evidence: AnalysisEvidence[] = [];
  for (const rule of rules) {
    for (const phrase of rule.phrases) {
      const quote = findQuote(text, phrase);
      if (!quote) continue;
      evidence.push({
        dimension: rule.field,
        label: rule.label,
        quote,
        sourceUrl,
        rationale: `原句命中「${phrase}」，所以只填写「${rule.label}」。未读取像素。`,
      });
      break;
    }
  }
  return evidence;
}

function joinLabels(evidence: AnalysisEvidence[], field: string) {
  const labels = evidence.filter((item) => item.dimension === field).map((item) => item.label);
  const unique = [...new Set(labels)];
  return unique.length ? unique.join("；") : null;
}

function confidenceFor(evidence: AnalysisEvidence[]) {
  const fields = new Set(evidence.map((item) => item.dimension));
  return Math.min(0.55, 0.35 + 0.05 * fields.size);
}

function emptySingle(input: {
  id: string;
  photographId: string;
  basis: TextBasis;
  evidenceNote: string;
}): SingleImageAnalysis {
  return {
    id: input.id,
    photographId: input.photographId,
    kind: "inference",
    schema: "single_image",
    status: "insufficient_text",
    basis: input.basis,
    pixelsRead: false,
    basicDescription: null,
    subjectScene: null,
    composition: null,
    light: null,
    color: null,
    visualWeight: null,
    spatialDepth: null,
    mood: null,
    narrative: null,
    theme: null,
    uniqueness: null,
    technique: null,
    confidence: null,
    modelName: null,
    modelVersion: null,
    analyzedAt: null,
    evidence: [],
    evidenceNote: input.evidenceNote,
  };
}

export function analyzeSingleText(input: {
  id: string;
  photographId: string;
  text: string | null;
  sourceUrl: string | null;
  analyzedAt: string;
  basis: TextBasis;
}): SingleImageAnalysis {
  const note = input.basis === "user_caption" ? USER_NOTE : OFFICIAL_NOTE;
  const text = input.text?.trim() ?? "";
  if (!text) return emptySingle({ ...input, evidenceNote: note });
  const evidence = collectEvidence(text, SINGLE_RULES, input.sourceUrl);
  if (evidence.length === 0) return emptySingle({ ...input, evidenceNote: note });
  const field = (name: SingleField) => joinLabels(evidence, name);
  return {
    id: input.id,
    photographId: input.photographId,
    kind: "inference",
    schema: "single_image",
    status: "text_grounded",
    basis: input.basis,
    pixelsRead: false,
    basicDescription: null,
    subjectScene: field("subjectScene"),
    composition: field("composition"),
    light: field("light"),
    color: field("color"),
    visualWeight: null,
    spatialDepth: field("spatialDepth"),
    mood: field("mood"),
    narrative: field("narrative"),
    theme: field("theme"),
    uniqueness: null,
    technique: field("technique"),
    confidence: confidenceFor(evidence),
    modelName: TEXT_MODEL_NAME,
    modelVersion: TEXT_MODEL_VERSION,
    analyzedAt: input.analyzedAt,
    evidence,
    evidenceNote: note,
  };
}

export function analyzePhotograph(photo: Photograph, analyzedAt: string): SingleImageAnalysis {
  return analyzeSingleText({
    id: `analysis-${photo.id}`,
    photographId: photo.id,
    text: photo.description,
    sourceUrl: photo.officialPageUrl,
    analyzedAt,
    basis: "official_text",
  });
}

export function analyzeSeriesText(input: {
  id: string;
  seriesId: string;
  text: string | null;
  sourceUrl: string | null;
  analyzedAt: string;
}): SeriesAnalysis {
  const text = input.text?.trim() ?? "";
  const blank = (): SeriesAnalysis => ({
    id: input.id,
    seriesId: input.seriesId,
    kind: "inference",
    schema: "series",
    status: "insufficient_text",
    basis: "official_text",
    pixelsRead: false,
    narrativeCoherence: null,
    visualUnity: null,
    imageRelations: null,
    themeDevelopment: null,
    pacing: null,
    completeness: null,
    confidence: null,
    modelName: null,
    modelVersion: null,
    analyzedAt: null,
    evidence: [],
    evidenceNote: OFFICIAL_NOTE,
  });
  if (!text) return blank();
  const evidence = collectEvidence(text, SERIES_RULES, input.sourceUrl);
  if (evidence.length === 0) return blank();
  const field = (name: SeriesField) => joinLabels(evidence, name);
  return {
    id: input.id,
    seriesId: input.seriesId,
    kind: "inference",
    schema: "series",
    status: "text_grounded",
    basis: "official_text",
    pixelsRead: false,
    narrativeCoherence: null,
    visualUnity: field("visualUnity"),
    imageRelations: field("imageRelations"),
    themeDevelopment: field("themeDevelopment"),
    pacing: null,
    completeness: null,
    confidence: confidenceFor(evidence),
    modelName: TEXT_MODEL_NAME,
    modelVersion: TEXT_MODEL_VERSION,
    analyzedAt: input.analyzedAt,
    evidence,
    evidenceNote: OFFICIAL_NOTE,
  };
}

export function analyzeSeriesWork(series: Series, analyzedAt: string): SeriesAnalysis {
  return analyzeSeriesText({
    id: `analysis-${series.id}`,
    seriesId: series.id,
    text: series.description,
    sourceUrl: series.officialSourceUrl,
    analyzedAt,
  });
}

export type TrendItem = {
  workId: string;
  title: string | null;
  label: string;
  quote: string;
  sourceUrl: string | null;
};

export type TrendDimension = {
  id: "subject" | "composition" | "color" | "narrative" | "theme" | "visual_style";
  label: string;
  status: "not_generated" | "text_quoted";
  reason: string;
  years: { year: 2025 | 2026; items: TrendItem[] }[];
};

const TREND_FIELDS: { id: TrendDimension["id"]; label: string; fields: string[] }[] = [
  { id: "subject", label: "题材分布", fields: ["subjectScene"] },
  { id: "composition", label: "构图方式", fields: ["composition"] },
  { id: "color", label: "色彩倾向", fields: ["color"] },
  { id: "narrative", label: "叙事方式", fields: ["narrative"] },
  { id: "theme", label: "主题表达", fields: ["theme", "themeDevelopment"] },
  { id: "visual_style", label: "视觉风格", fields: ["technique", "visualUnity"] },
];

export function buildTrendDimensions(
  rows: {
    year: 2025 | 2026;
    workId: string;
    title: string | null;
    analysis: SingleImageAnalysis | SeriesAnalysis | null;
  }[],
): TrendDimension[] {
  return TREND_FIELDS.map((trend) => {
    const years = ([2025, 2026] as const).map((year) => {
      const items: TrendItem[] = [];
      for (const row of rows.filter((item) => item.year === year)) {
        const analysis = row.analysis;
        if (!analysis || analysis.status !== "text_grounded") continue;
        for (const evidence of analysis.evidence) {
          if (!trend.fields.includes(evidence.dimension)) continue;
          items.push({
            workId: row.workId,
            title: row.title,
            label: evidence.label,
            quote: evidence.quote,
            sourceUrl: evidence.sourceUrl,
          });
        }
      }
      return { year, items };
    });
    const quoted = years.some((year) => year.items.length > 0);
    return {
      id: trend.id,
      label: trend.label,
      status: quoted ? "text_quoted" : "not_generated",
      reason: quoted
        ? "只列出这一赛制官方说明里的原句，按年分开。这不是像素上的变化。"
        : "这一赛制的官方说明没有写到这一维。不从标题或组别名称补写，也不读像素。",
      years,
    };
  });
}
