import { getSeries, seriesAnalysis } from "@/lib/catalog";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getSeries(id)) return Response.json({ message: "没有这个系列" }, { status: 404 });
  const analysis = seriesAnalysis(id);
  const grounded = analysis?.status === "text_grounded";
  return Response.json({
    kind: "inference",
    schema: "series",
    pixelsRead: false,
    message: grounded
      ? "已用系列说明原句填写命中的组图维度。单张字段没有拿来冒充系列结论，也没有读取像素。"
      : "系列说明没有命中组图词表。叙事连贯、节奏和完整度保持空白。没有读取像素。",
    analysis,
  });
}
