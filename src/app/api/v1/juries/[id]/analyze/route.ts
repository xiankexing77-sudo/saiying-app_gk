import { getJury, juryProfile } from "@/lib/catalog";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getJury(id)) return Response.json({ message: "没有这位评委" }, { status: 404 });
  const profile = juryProfile(id);
  return Response.json({
    kind: "inference",
    message: "样本不足，未根据简介生成审美偏好，也没有把获奖作品归因到个人投票。",
    inference: profile.inference,
  });
}
