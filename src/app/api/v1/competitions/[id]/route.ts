import { getCompetition, listEditions } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const competition = getCompetition();
  if (id !== competition.id) {
    return Response.json({ message: "没有这场赛事" }, { status: 404 });
  }
  return Response.json({ competition, editions: listEditions() });
}
