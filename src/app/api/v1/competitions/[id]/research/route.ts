import { getCompetition } from "@/lib/catalog";
import { createResearchTask, type ResearchRequest } from "@/lib/tasks";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (id !== getCompetition().id) {
    return Response.json({ message: "没有这场赛事" }, { status: 404 });
  }
  const body = (await request.json()) as Partial<ResearchRequest>;
  const result = await createResearchTask({
    years: body.years ?? [],
    scope: {
      winners: body.scope?.winners ?? true,
      shortlists: body.scope?.shortlists ?? false,
      juries: body.scope?.juries ?? true,
      juryPortfolios: body.scope?.juryPortfolios ?? false,
      imageAnalysis: body.scope?.imageAnalysis ?? false,
      reportGeneration: body.scope?.reportGeneration ?? false,
    },
    forceRefresh: body.forceRefresh ?? false,
  });
  if (!result.ok) {
    return Response.json({ message: result.message }, { status: result.status });
  }
  return Response.json(
    {
      created: result.created,
      task: result.task,
      message: result.created
        ? "任务已入队。请求立即返回，进程内接着跑可执行的阶段，不在这次响应里抓取或看图。"
        : "相同范围的任务已经存在。",
    },
    { status: result.created ? 202 : 200 },
  );
}
