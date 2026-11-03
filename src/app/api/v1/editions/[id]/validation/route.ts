import { collectEditionById } from "@/lib/collection";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const report = collectEditionById(id);
  if (!report) return Response.json({ message: "没有这一届的交叉验证" }, { status: 404 });
  return Response.json(report);
}
