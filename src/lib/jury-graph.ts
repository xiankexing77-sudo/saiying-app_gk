import { getJury, juryAssignments, juryProfile, quotesBySpeaker } from "./catalog";

export type GraphNode = {
  id: string;
  kind: "jury" | "edition" | "sample_group" | "style_tag" | "quote";
  label: string;
  tone: "fact" | "inference";
};

export type GraphEdge = {
  from: string;
  to: string;
  relation: string;
  boundary: string;
};

export function juryResearchGraph(juryId: string) {
  const jury = getJury(juryId);
  if (!jury) return null;
  const profile = juryProfile(juryId);
  const nodes: GraphNode[] = [{ id: jury.id, kind: "jury", label: jury.name, tone: "fact" }];
  const edges: GraphEdge[] = [];

  for (const assignment of juryAssignments(jury.id)) {
    const id = `assign-${assignment.id}`;
    nodes.push({
      id,
      kind: "edition",
      label: `${assignment.editionId.replace("swpa-", "")} · ${assignment.roleTitle}`,
      tone: "fact",
    });
    edges.push({
      from: jury.id,
      to: id,
      relation: "参与届次",
      boundary: "只记录公开职务和赛制。不表示这位评委选择了某件获奖作品。",
    });
  }

  const groups = profile.personalWorks?.groups ?? [];
  for (const group of groups) {
    nodes.push({ id: group.id, kind: "sample_group", label: group.title, tone: "fact" });
    edges.push({
      from: jury.id,
      to: group.id,
      relation: "本人作品样本组",
      boundary: "同一套作品出现在多个页面只计 1 组。评委评论过的获奖作品不计。",
    });
  }

  for (const tag of profile.inference?.styleTags ?? []) {
    nodes.push({ id: tag.id, kind: "style_tag", label: tag.label, tone: "inference" });
    for (const groupId of tag.groupIds) {
      edges.push({
        from: tag.id,
        to: groupId,
        relation: "依据样本组",
        boundary: "标签引用该组公开陈述，不读像素，也不用职务简介。",
      });
    }
  }

  quotesBySpeaker(jury.name).forEach(({ quote, series }, index) => {
    const id = `quote-${series.id}-${index}`;
    nodes.push({ id, kind: "quote", label: `关于《${series.title ?? series.id}》的公开引语`, tone: "fact" });
    edges.push({
      from: jury.id,
      to: id,
      relation: "公开引语",
      boundary: quote.boundary,
    });
  });

  const gaps: string[] = [];
  if (!profile.facts?.education) gaps.push("教育背景未采集");
  if (!profile.facts?.publications.length) gaps.push("公开出版物未采集");
  if (!profile.facts?.interviews.length) gaps.push("采访未采集");
  if (groups.length < 3) gaps.push(`本人作品样本不足 ${groups.length}/3`);

  return {
    juryId: jury.id,
    name: jury.name,
    nodes,
    edges,
    gaps,
    absent: ["没有从评委指向具体获奖作品的选择边或投票边。SWPA 是匿名评审。"],
  };
}
