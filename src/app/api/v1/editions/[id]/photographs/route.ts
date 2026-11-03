import { getEdition, listLibrary } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getEdition(id)) return Response.json({ message: "没有这一届" }, { status: 404 });
  return Response.json({ photographs: listLibrary().filter((item) => item.editionId === id) });
}
