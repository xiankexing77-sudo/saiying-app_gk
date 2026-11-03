import { generateStyleTags } from "../../../../../../../agents/style-tags";
import { getJury, personalWorks } from "@/lib/catalog";
import { SEED_FETCHED_AT } from "@/lib/data/sources";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const jury = getJury(id);
  if (!jury) return Response.json({ message: "没有这位评委" }, { status: 404 });
  const works = personalWorks(id);
  const groups = works?.groups ?? [];
  const inference = generateStyleTags({
    subjectId: id,
    groups,
    analyzedAt: SEED_FETCHED_AT,
  });
  const enough = inference.sampleStatus === "sufficient";
  return Response.json({
    kind: "inference",
    message: enough
      ? `已根据 ${groups.length} 组本人作品的公开陈述生成风格标签。未读取像素，未使用职务简介。`
      : `样本不足。本人作品样本组 ${groups.length}/3，未生成风格标签，也没有把获奖作品归因到个人投票。`,
    groupCount: groups.length,
    requiredGroups: 3,
    inference,
  });
}
