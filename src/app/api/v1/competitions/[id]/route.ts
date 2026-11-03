import { getCompetition, listEditions } from "@/lib/catalog";
import { collectCompetition } from "@/lib/collection";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const competition = getCompetition();
  if (id !== competition.id) {
    return Response.json({ message: "没有这场赛事" }, { status: 404 });
  }
  const validation = collectCompetition();
  return Response.json({
    competition,
    editions: listEditions(),
    validation: {
      summary: validation.summary,
      collectionMode: validation.collectionMode,
      network: validation.network,
      editions: validation.editions.map((edition) => ({
        editionId: edition.editionId,
        summary: edition.summary,
        conflicts: edition.fields.filter((field) => field.verdict === "conflict").length,
      })),
    },
  });
}
