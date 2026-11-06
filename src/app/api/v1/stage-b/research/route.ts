import { parsePublicSources } from "@/lib/stage-b/source";
import { createStageBTask } from "@/lib/tasks";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    years?: number[];
    forceRefresh?: boolean;
    injectFailureWorkId?: string | null;
    publicSources?: unknown;
  };
  const publicSources = parsePublicSources(body.publicSources);
  if ("error" in publicSources) return Response.json({ message: publicSources.error }, { status: 400 });
  const result = await createStageBTask({
    years: body.years ?? [2025, 2026],
    forceRefresh: body.forceRefresh ?? false,
    injectFailureWorkId: body.injectFailureWorkId ?? null,
    publicSources,
  });
  if (!result.ok) return Response.json({ message: result.message }, { status: result.status });
  return Response.json(
    {
      created: result.created,
      task: result.task,
      liveCrawl: false,
      stageA: "fixture_only_not_done",
      marketplace: false,
      message: result.created
        ? "阶段 B 任务已入队。可以下载 fixture 里的官方图像，也可以下载提交的公开网页图像。缺少 sourceUrl、downloadedAt 或 storagePath 的像素不进入视觉读取。web_other、unverified_match、rights_unverified 不写入事实栏。不把 Stage A 标成 live crawl 完成。"
        : "相同范围的阶段 B 任务已经存在。",
    },
    { status: result.created ? 202 : 200 },
  );
}
