import { getJury, juryAssignments } from "@/lib/catalog";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const jury = getJury(id);
  if (!jury) return Response.json({ message: "没有这位评委" }, { status: 404 });
  return Response.json({ jury, assignments: juryAssignments(id) });
}
