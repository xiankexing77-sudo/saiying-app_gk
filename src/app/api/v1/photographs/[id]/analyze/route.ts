import { getPhotograph, singleAnalysis } from "@/lib/catalog";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const photograph = getPhotograph(id);
  const analysis = singleAnalysis(id);
  if (!photograph || !analysis) {
    return Response.json({ message: "没有这张可分析的作品" }, { status: 404 });
  }
  const grounded = analysis.status === "text_grounded";
  return Response.json({
    kind: "inference",
    pixelsRead: false,
    message: grounded
      ? "已根据官方说明原句填写命中的维度。没有读取像素，未命中的维度仍为空。"
      : "说明不足以填写视觉维度。没有读取像素，也没有把标题改写成分析。",
    analysis,
  });
}
