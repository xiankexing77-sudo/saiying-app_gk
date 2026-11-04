import { juryResearchGraph } from "@/lib/jury-graph";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const graph = juryResearchGraph(id);
  if (!graph) return Response.json({ message: "没有这位评委" }, { status: 404 });
  return Response.json(graph);
}
