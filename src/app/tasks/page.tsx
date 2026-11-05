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
        lede="创建请求立刻返回任务。进程内接着跑可执行的阶段：夹具交叉验证、说明证据和评委样本。不会抓取官网，也不会读取原图。像素分析和 Shortlist 会停在阻塞。"
      />
      <div className="mt-8">
        <TaskBoard stages={graph.nodes} />
      </div>
    </PageMain>
  );
}
