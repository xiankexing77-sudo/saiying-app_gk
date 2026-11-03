import { getPhotograph, singleAnalysis } from "@/lib/catalog";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const photograph = getPhotograph(id);
  if (!photograph || photograph.role !== "standalone") {
    return Response.json({ message: "没有这张可分析的单张作品" }, { status: 404 });
  }
  return Response.json({
    kind: "inference",
    message: "已返回未执行的单张分析模板。没有调用视觉模型，也没有读取图像像素。",
    analysis: singleAnalysis(id),
  });
}
