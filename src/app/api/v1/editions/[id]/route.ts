import { editionSnapshot } from "@/lib/catalog";
import { collectEditionById } from "@/lib/collection";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const snapshot = editionSnapshot(id);
  if (!snapshot) return Response.json({ message: "没有这一届" }, { status: 404 });
  const validation = collectEditionById(id);
  return Response.json({
    ...snapshot,
    validation: validation
      ? {
          summary: validation.summary,
          collectionMode: validation.collectionMode,
          network: validation.network,
          conflicts: validation.fields.filter((field) => field.verdict === "conflict"),
        }
      : null,
  });
}
