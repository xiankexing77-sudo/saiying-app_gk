import { runStubGraph } from "../../../agents/graph";
import { TaskBoard } from "@/components/task-board";
import { PageHeader, PageMain } from "@/components/page-header";

export const metadata = { title: "任务" };

export default function TasksPage() {
  const graph = runStubGraph([2025, 2026]);
  return (
    <PageMain>
      <PageHeader
        kicker="Tasks"
        title="采集与研究任务"
        lede="长任务只入队。重试把阻塞任务放回队列，不会在浏览器请求里抓取官网或调用模型。"
      />
      <div className="mt-8">
        <TaskBoard stages={graph.nodes} />
      </div>
    </PageMain>
  );
}
