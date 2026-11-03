import { getTask } from "@/lib/tasks";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const task = await getTask(id);
  if (!task) return Response.json({ message: "任务不存在" }, { status: 404 });
  return Response.json({ task });
}
