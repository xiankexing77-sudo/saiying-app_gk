import { awardsFor, getPhotograph, singleAnalysis } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const photograph = getPhotograph(id);
  if (!photograph) return Response.json({ message: "没有这张作品" }, { status: 404 });
  return Response.json({
    photograph,
    awards: awardsFor({ photographId: id }),
    analysis: photograph.role === "standalone" ? singleAnalysis(id) : null,
  });
}
