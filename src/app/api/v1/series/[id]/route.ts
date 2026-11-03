import { awardsFor, getSeries, seriesAnalysis, seriesFrames } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const series = getSeries(id);
  if (!series) return Response.json({ message: "没有这个系列" }, { status: 404 });
  return Response.json({ series, frames: seriesFrames(id), awards: awardsFor({ seriesId: id }), analysis: seriesAnalysis(id) });
}
