import { CLAIM_CATALOG, REQUIRED_SAMPLE_GROUPS } from "../collectors/portfolio/claims";
import type { JuryInference, SampleGroup, StyleDimension, StyleTag } from "../src/lib/data/types";

export const STYLE_MODEL_NAME = "pji-style-tags";
export const STYLE_MODEL_VERSION = "text-grounded-1.0.0";

const DIMENSION_ORDER: StyleDimension[] = [
  "visual_style",
  "subject",
  "color",
  "composition",
  "narrative",
  "theme",
];

/**
 * 未读像素。跨组线索上限 0.7；只出现在一组时更低，并且不写入偏好字段。
 * 2 组 0.56，1 组 0.38。
 */
export function tagConfidence(sampleCount: number) {
  if (sampleCount >= 3) return 0.7;
  if (sampleCount === 2) return 0.56;
  return 0.38;
}

export function generateStyleTags(input: {
  subjectId: string;
  groups: SampleGroup[];
  analyzedAt: string;
}): JuryInference {
  const groupCount = input.groups.length;
  if (groupCount < REQUIRED_SAMPLE_GROUPS) {
    return {
      juryId: input.subjectId,
      kind: "inference",
      sampleStatus: "insufficient",
      sampleCount: groupCount,
      confidence: null,
      modelName: null,
      modelVersion: null,
      analyzedAt: null,
      requiredGroupCount: REQUIRED_SAMPLE_GROUPS,
      evidence: [],
      styleTags: [],
      visualStyle: null,
      commonSubjects: null,
      colorTendency: null,
      compositionTendency: null,
      narrativePreference: null,
      thematicMode: null,
      statement: `样本不足。本人作品样本组 ${groupCount}/${REQUIRED_SAMPLE_GROUPS}。不足 3 组时不生成风格标签，也不凭职务简介或零散作品说明臆测色彩、构图或题材偏好。SWPA 为匿名评审，不把获奖作品归因于评委个人的选择。`,
    };
  }

  const tags: StyleTag[] = [];
  for (const [key, meta] of Object.entries(CLAIM_CATALOG)) {
    const hits = input.groups
      .map((group) => ({
        group,
        claims: group.claims.filter((claim) => claim.key === key && claim.quote.trim().length > 0),
      }))
      .filter((hit) => hit.claims.length > 0);
    if (hits.length === 0) continue;
    const sampleCount = hits.length;
    const scope = sampleCount >= 2 ? "cross_group" : "single_group";
    const evidence = hits.flatMap(({ group, claims }) =>
      claims.map((claim) => ({
        sourceUrl: claim.sourceUrl,
        groupId: group.id,
        groupTitle: group.title,
        quote: claim.quote,
        rationale: `《${group.title}》的公开陈述写有：「${claim.quote}」`,
      })),
    );
    const statement =
      scope === "cross_group"
        ? `${meta.label}：${sampleCount} 组本人作品的公开陈述写到这一点。`
        : `${meta.label}：只出现在《${hits[0]?.group.title ?? ""}》。单组观察，不写成个人偏好。`;
    tags.push({
      id: `tag-${input.subjectId}-${key}`,
      subjectId: input.subjectId,
      dimension: meta.dimension,
      label: meta.label,
      scope,
      statement,
      confidence: tagConfidence(sampleCount),
      sampleCount,
      groupIds: hits.map((hit) => hit.group.id),
      evidence,
      modelName: STYLE_MODEL_NAME,
      modelVersion: STYLE_MODEL_VERSION,
    });
  }

  tags.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope === "cross_group" ? -1 : 1;
    const dimension = DIMENSION_ORDER.indexOf(a.dimension) - DIMENSION_ORDER.indexOf(b.dimension);
    if (dimension !== 0) return dimension;
    return a.label.localeCompare(b.label, "zh");
  });

  const cross = tags.filter((tag) => tag.scope === "cross_group");
  const summary = (dimension: StyleDimension) => {
    const labels = cross.filter((tag) => tag.dimension === dimension).map((tag) => tag.label);
    return labels.length ? labels.join("；") : null;
  };
  const confidence = cross.length ? Math.min(...cross.map((tag) => tag.confidence)) : null;

  return {
    juryId: input.subjectId,
    kind: "inference",
    sampleStatus: "sufficient",
    sampleCount: groupCount,
    confidence,
    modelName: STYLE_MODEL_NAME,
    modelVersion: STYLE_MODEL_VERSION,
    analyzedAt: input.analyzedAt,
    requiredGroupCount: REQUIRED_SAMPLE_GROUPS,
    evidence: cross.flatMap((tag) => tag.evidence.map((item) => ({ sourceUrl: item.sourceUrl, rationale: item.rationale }))),
    styleTags: tags,
    visualStyle: summary("visual_style"),
    commonSubjects: summary("subject"),
    colorTendency: summary("color"),
    compositionTendency: summary("composition"),
    narrativePreference: summary("narrative"),
    thematicMode: summary("theme"),
    statement: `已采集 ${groupCount} 组本人作品，达到 ${REQUIRED_SAMPLE_GROUPS} 组。风格标签由 ${STYLE_MODEL_NAME}（${STYLE_MODEL_VERSION}）根据这些作品页面上的陈述归并，没有读取像素，也没有使用职务简介。同一线索至少出现在 2 组里，才写入偏好字段；只出现在 1 组的线索标为单组观察。样本数量按组计。SWPA 为匿名评审，这些标签不表示该评委选择了某件获奖作品。`,
  };
}
