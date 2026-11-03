import {
  ANALYSIS_ENGINE,
  DISCLAIMER,
  MISSING,
  PROMPT_VERSION,
  SNAPSHOT_AT,
  type AnalysisResult,
  type Award,
  type Category,
  type EditionYear,
  type EvidenceJson,
  type Judge,
  type Work,
} from "@/lib/types";

export type EditionStats = {
  year: EditionYear;
  workCount: number;
  byCategory: { name_zh: string; count: number }[];
  byAward: { award_type: string; count: number }[];
};

export type AnalysisContext = {
  works: Work[];
  awards: Award[];
  categories: Category[];
  judges: Judge[];
  judgesByYear: Record<EditionYear, Judge[]>;
  statsByYear: Record<EditionYear, EditionStats>;
};

const BANNED = [
  /评分/,
  /打分/,
  /分数/,
  /满分/,
  /钦点/,
  /单独选/,
  /一人选/,
  /官方结果/,
  /原话/,
  /排名算法/,
];

export function assertHonest(text: string) {
  for (const pattern of BANNED) {
    if (pattern.test(text)) {
      throw new Error(`推断文案碰到了禁用说法「${pattern}」：${text.slice(0, 80)}`);
    }
  }
}

function clip(text: string, max = 72) {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return flat.slice(0, max).replace(/[，。、；,.\s]+$/u, "") + "…";
}

function categoryOf(ctx: AnalysisContext, work: Work) {
  const category = ctx.categories.find((item) => item.id === work.category_id);
  if (!category) throw new Error(`missing category ${work.category_id}`);
  return category;
}

function awardsOf(ctx: AnalysisContext, work: Work) {
  return ctx.awards.filter((item) => item.work_id === work.id);
}

function seatHint(categoryName: string, year: EditionYear) {
  const seat: Record<string, string> = {
    风光: "风光、长曝光和完成度相关的席位，例如 Francesco Gola、Bertram Hönlinger 的页上角色",
    人像: "人像席位，例如肖全，2026 还有黎晓亮；Bertram Hönlinger 的页上角色也写到肖像",
    夜景: "夜景、长曝光和移动影像能力相关的席位，例如 Francesco Gola、于猛的页上角色",
    动态: "动态题材和移动影像能力相关的席位，例如于猛页上角色里的技术向",
    长焦与微距: "长焦、微距和移动影像能力相关的席位，例如于猛的页上角色；创意也在公开初选维度里",
    组图: "用一组照片做人物或事件档案的席位，例如肖全页上角色里的肖像记录",
  };
  const focus = seat[categoryName] ?? "本届公开席位";
  const webb =
    year === 2025
      ? "2025 还有 Alex Webb，页上角色是彩色街头。画面如果不是街头层次，就不要硬往这个席位上靠。"
      : "2026 的席位里没有 Alex Webb，由黎晓亮接上人像一侧。";
  return `若要做席位对照，这件${categoryName}作品更靠近${focus}。${webb}对照只说明席位可能覆盖这类题材，不能据此说某一位评委决定了这件作品。`;
}

function exercisesFor(categoryName: string, zeiss: boolean) {
  const common: Record<string, string[]> = {
    风光: [
      "先用手机取景框找三层：近处一块能看清的东西、中间的主体、远处的天或山。少一层就先别按。",
      "把同一处景色横竖各拍一张，看哪一张的线条把视线送到你想让人停留的地方。",
    ],
    人像: [
      "先看光线打在脸的哪一侧，再请对方做一个很小的动作，而不是只对着镜头停住。",
      "人物旁边留一块安静的背景。背景比脸还抢眼时，把人移到画面一侧再拍。",
    ],
    夜景: [
      "先决定亮的东西（灯、月、烟花）放在哪个角落，再看暗部还要不要留一点细节。",
      "手持夜景先靠稳，连拍三张，留下没有糊掉的那一张，而不是只留最亮的一张。",
    ],
    动态: [
      "先找一条静止的背景线，让运动从这条线上穿过去，动作才看得清。",
      "提前半秒按住快门，而不是等动作做完再补。差的那一下往往比做成的那一下更有事。",
    ],
    长焦与微距: [
      "先让主体从背景里分离出来，再靠近半步。细节要能变成一件小事，而不只是放大。",
      "拍完看边缘：糊掉的背景有没有抢主体。抢了就把主体再挪开一点。",
    ],
    组图: [
      "同一主题拍三张：环境、人、一个细节。三张要能按顺序讲完一件小事。",
      "删到只剩你愿意逐张讲一句的那些。讲不出那一句的，先不要放进组里。",
    ],
  };
  const list = [...(common[categoryName] ?? common["风光"])];
  if (zeiss) {
    list.push(
      "如果走蔡司专业风格奖这条路，单独检查色彩和镜头气质是否自洽。它和主赛不是同一条终审路径。",
    );
  }
  return list.slice(0, 3);
}

function awardPoint(work: Work, awardTypes: string[], categoryName: string) {
  const names = awardTypes.join("、");
  if (awardTypes.includes("年度最佳")) {
    return `《${work.title}》在 ${work.year} 届被列为「年度最佳」，题材是${categoryName}。公开赛制里，年度最佳通常会从各类别第一名中再看一遍。这里只能确认它走的是主赛路径，没有任何可以引用的评委结果数字。`;
  }
  if (awardTypes.includes("蔡司专业风格奖") && awardTypes.length === 1) {
    return `奖项是「蔡司专业风格奖」，题材是${categoryName}。公开规则把这条奖和主赛分开，由蔡司相关评委做独立终审。`;
  }
  if (awardTypes.includes("类别第一名")) {
    return `奖项里有「类别第一名」，题材是${categoryName}（官网单元名：${work.gallery_unit_name}）。公开初选会看构图、视角、创意，以及和主题贴不贴。`;
  }
  if (awardTypes.includes("类别优胜")) {
    return `奖项是「类别优胜」，题材是${categoryName}（官网单元名：${work.gallery_unit_name}）。它没有被写成该单元的第一名。能看的公开维度仍是构图、视角、创意和主题。`;
  }
  return `这件作品的奖项是「${names}」，题材是${categoryName}。这类奖项在公开规则里和六个单元的主赛路径并行，不能把它说成单元名次。`;
}

function modelMeta(regenerated: boolean) {
  return {
    engine: ANALYSIS_ENGINE,
    prompt_version: PROMPT_VERSION,
    note: "本地规则模板写出的学习向推断。不是大模型现场作文，也不是官网评语。",
    regenerated,
  };
}

function ready(
  partial: Omit<AnalysisResult, "status" | "model_meta" | "created_at"> & {
    created_at?: string;
    regenerated?: boolean;
  },
): AnalysisResult {
  assertHonest(partial.summary);
  for (const point of partial.evidence_json.points ?? []) assertHonest(point);
  for (const tip of partial.evidence_json.exercises ?? []) assertHonest(tip);
  if (partial.evidence_json.inferred_column) {
    assertHonest(partial.evidence_json.inferred_column);
  }
  return {
    ...partial,
    status: "ready",
    created_at: partial.created_at ?? SNAPSHOT_AT,
    model_meta: modelMeta(Boolean(partial.regenerated)),
  };
}

export function selectionFor(
  ctx: AnalysisContext,
  work: Work,
  createdAt = SNAPSHOT_AT,
  regenerated = false,
): AnalysisResult {
  const category = categoryOf(ctx, work);
  const awards = awardsOf(ctx, work);
  const awardTypes = awards.map((item) => item.award_type);
  const zeiss = awardTypes.includes("蔡司专业风格奖");
  const points = [
    awardPoint(work, awardTypes, category.name_zh),
    work.description
      ? `官网作品说明里有一句：「${clip(work.description)}」推断上，评审公开维度里的「主题是否贴题」和「创意」可能正是从这种具体事情上看出来的。说明本身不是评委写的评语。`
      : `官网作品说明：${MISSING}。没有说明时，不能替作者编一个拍摄故事。`,
    work.phone_model
      ? `机型字段是 ${work.phone_model}。可以把它理解成「当时用这部手机完成了这个题材」，方便对照夜景、长焦或微距一类能力。它不是投票记录。`
      : `机型：${MISSING}。${work.phone_note ?? ""}没有机型时不要猜测是哪一台手机。`,
    seatHint(category.name_zh, work.year),
  ];
  if (zeiss && !points[0].includes("独立终审")) {
    points.push(
      "这件作品同时或单独标了「蔡司专业风格奖」。公开规则里，这条奖由蔡司相关评委独立终审，和主赛不是同一条路径。本届席位中 Francesco Gola、Bertram Hönlinger 的页上角色与蔡司有关。这只是路径说明。",
    );
  }
  if (work.official_comments.length > 0) {
    points.push(
      "作品页另有官网公示评语，请在标着「官网原文」的栏目里读。本卡不改写那些句子，也不把它们收成自己的结论。",
    );
  }
  const trimmed = points.slice(0, 6);
  const exercises = exercisesFor(category.name_zh, zeiss);
  const summary = [
    `《${work.title}》为何可能入选`,
    ...trimmed.map((point, index) => `${index + 1}. ${point}`),
    "可以练的几步",
    ...exercises.map((tip, index) => `${index + 1}. ${tip}`),
    DISCLAIMER,
    "页面上的点赞只是读者点过一次心，不能拿来解释它为什么入选。",
  ].join("\n\n");
  const evidence: EvidenceJson = {
    sources: [
      {
        type: "work_field",
        keys: ["title", "category", "award_type", "phone_model", "description", "year"],
      },
      {
        type: "judge_bio",
        judge_ids: ctx.judgesByYear[work.year].map((judge) => judge.id),
        source_url: "https://visionplus.vivo.com/competition.html/photoawards",
      },
      {
        type: "rule_dimension",
        dims: ["composition", "creativity", "theme", "zeiss_independent_review"],
      },
      { type: "edition_distribution", year: work.year },
    ],
    disclaimer: DISCLAIMER,
    points: trimmed,
    exercises,
    zeiss_path: zeiss,
  };
  return ready({
    id: `analysis-selection-${work.id}`,
    target_type: "work",
    target_id: work.id,
    kind: "selection_reason",
    summary,
    evidence_json: evidence,
    created_at: createdAt,
    regenerated,
  });
}

function statsLine(stats: EditionStats) {
  const cats = stats.byCategory
    .filter((item) => item.count > 0)
    .map((item) => `${item.name_zh} ${item.count}`)
    .join("、");
  return `${stats.year} 届获奖 ${stats.workCount} 件，题材大致是 ${cats}`;
}

export function styleFor(
  ctx: AnalysisContext,
  judge: Judge,
  createdAt = SNAPSHOT_AT,
  regenerated = false,
): AnalysisResult {
  const years = (Object.keys(ctx.judgesByYear) as unknown as EditionYear[]).filter(
    (year) => ctx.judgesByYear[year].some((item) => item.id === judge.id),
  );
  const official = judge.bio_official.trim() ? judge.bio_official.trim() : MISSING;
  const dist = years.map((year) => statsLine(ctx.statsByYear[year])).join("；");
  const inferredParts = [
    `推断偏好：${judge.style_tags_inferred.join("、")}。`,
    "这些词只来自页上角色，再加上本届获奖题材的席位对照，不用站外作品集补强。",
    `${dist}。分布说明这一届公开结果里有哪些题材，不能证明这位评委的个人口味，也不能说明某件作品由谁决定。`,
  ];
  if (judge.zeiss_path) {
    inferredParts.push(
      "蔡司专业风格奖另有蔡司评委独立终审路径，和六个单元的主赛不是同一条路。",
    );
  }
  const inferred = inferredParts.join("");
  const summary = [`官网简介原文`, official, `推断`, inferred, DISCLAIMER].join("\n\n");
  return ready({
    id: `analysis-style-${judge.id}`,
    target_type: "judge",
    target_id: judge.id,
    kind: "style",
    summary,
    evidence_json: {
      sources: [
        {
          type: "judge_bio",
          judge_ids: [judge.id],
          source_url: judge.source_url,
        },
        ...years.map((year) => ({
          type: "edition_distribution" as const,
          year,
        })),
      ],
      disclaimer: DISCLAIMER,
      official_column: official,
      inferred_column: inferred,
      tags: judge.style_tags_inferred,
      zeiss_path: judge.zeiss_path,
    },
    created_at: createdAt,
    regenerated,
  });
}

export function overviewFor(
  ctx: AnalysisContext,
  year: EditionYear,
  createdAt = SNAPSHOT_AT,
  regenerated = false,
): AnalysisResult {
  const stats = ctx.statsByYear[year];
  const awards = stats.byAward.map((item) => `${item.award_type} ${item.count}`).join("、");
  const summary = `${statsLine(stats)}。奖项结构：${awards}。一句话：这一届公开结果盖过六个题材，旁边还有特别推荐、系列机型、蔡司和学生奖等并行奖项。这是结构概览，不是审美高下。${DISCLAIMER}`;
  return ready({
    id: `analysis-edition-${year}`,
    target_type: "edition",
    target_id: String(year),
    kind: "edition_overview",
    summary,
    evidence_json: {
      sources: [{ type: "edition_distribution", year }],
      disclaimer: DISCLAIMER,
      points: [summary],
    },
    created_at: createdAt,
    regenerated,
  });
}

export function buildAnalyses(ctx: AnalysisContext, createdAt = SNAPSHOT_AT) {
  return [
    ...ctx.works.map((work) => selectionFor(ctx, work, createdAt)),
    ...ctx.judges.map((judge) => styleFor(ctx, judge, createdAt)),
    ...([2025, 2026] as EditionYear[]).map((year) => overviewFor(ctx, year, createdAt)),
  ];
}

export function regenerateAnalysis(
  ctx: AnalysisContext,
  targetType: AnalysisResult["target_type"],
  targetId: string,
  kind: AnalysisResult["kind"],
): AnalysisResult {
  const createdAt = new Date().toISOString();
  if (kind === "selection_reason" && targetType === "work") {
    const work = ctx.works.find((item) => item.id === targetId);
    if (!work) return failed(targetType, targetId, kind, createdAt);
    return selectionFor(ctx, work, createdAt, true);
  }
  if (kind === "style" && targetType === "judge") {
    const judge = ctx.judges.find((item) => item.id === targetId);
    if (!judge) return failed(targetType, targetId, kind, createdAt);
    return styleFor(ctx, judge, createdAt, true);
  }
  if (kind === "edition_overview" && targetType === "edition") {
    if (targetId !== "2025" && targetId !== "2026") {
      return failed(targetType, targetId, kind, createdAt);
    }
    return overviewFor(ctx, Number(targetId) as EditionYear, createdAt, true);
  }
  return failed(targetType, targetId, kind, createdAt);
}

function failed(
  targetType: AnalysisResult["target_type"],
  targetId: string,
  kind: AnalysisResult["kind"],
  createdAt: string,
): AnalysisResult {
  return {
    id: `analysis-failed-${targetType}-${targetId}-${kind}`,
    target_type: targetType,
    target_id: targetId,
    kind,
    summary: "没有找到对应的作品、评委或届次，推断没有生成。",
    evidence_json: {
      sources: [],
      disclaimer: DISCLAIMER,
    },
    model_meta: modelMeta(true),
    status: "failed",
    created_at: createdAt,
  };
}
