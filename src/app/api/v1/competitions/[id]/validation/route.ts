import { getCompetition } from "@/lib/catalog";
import { collectCompetition } from "@/lib/collection";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== getCompetition().id) {
    return Response.json({ message: "没有这场赛事" }, { status: 404 });
  }
  return Response.json(collectCompetition());
}
