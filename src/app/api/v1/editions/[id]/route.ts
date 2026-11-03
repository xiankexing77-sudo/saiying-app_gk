import { editionSnapshot } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const snapshot = editionSnapshot(id);
  if (!snapshot) return Response.json({ message: "没有这一届" }, { status: 404 });
  return Response.json(snapshot);
}
