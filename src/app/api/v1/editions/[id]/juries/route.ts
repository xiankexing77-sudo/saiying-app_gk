import { getEdition, juryAssignments, listJuries } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getEdition(id)) return Response.json({ message: "没有这一届" }, { status: 404 });
  const assignments = juryAssignments(undefined, id);
  return Response.json({
    juries: assignments.map((assignment) => ({
      assignment,
      jury: listJuries().find((jury) => jury.id === assignment.juryId) ?? null,
    })),
  });
}
