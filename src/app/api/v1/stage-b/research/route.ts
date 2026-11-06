import { createStageBTask } from "@/lib/tasks";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    years?: number[];
    forceRefresh?: boolean;
    injectFailureWorkId?: string | null;
  };
  const result = await createStageBTask({
    years: body.years ?? [2025, 2026],
    forceRefresh: body.forceRefresh ?? false,
    injectFailureWorkId: body.injectFailureWorkId ?? null,
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: result.status });
  return Response.json(
    {
      created: result.created,
      task: result.task,
      liveCrawl: false,
      message: result.created
        ? "阶段 B 任务已入队。只下载 fixture 里的官方图像 URL，不把 Stage A 标成 live crawl 完成。"
        : "相同范围的阶段 B 任务已经存在。",
    },
    { status: result.created ? 202 : 200 },
  );
}
