import { retryTask } from "@/lib/tasks";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const result = await retryTask(id);
  if (!result.ok) {
    return Response.json({ message: result.message, task: "task" in result ? result.task : undefined }, { status: result.status });
  }
  return Response.json({
    message: "任务已重新入队。进程内会再跑可执行的阶段，不会抓取官网，也不会读取原图。",
    task: result.task,
  });
}
