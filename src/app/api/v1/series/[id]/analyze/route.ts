import { getSeries, seriesAnalysis } from "@/lib/catalog";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getSeries(id)) return Response.json({ message: "没有这个系列" }, { status: 404 });
  return Response.json({
    kind: "inference",
    schema: "series",
    message: "已返回未执行的系列分析模板。系列 schema 与单张分开，当前没有模型结果。",
    analysis: seriesAnalysis(id),
  });
}
