import { runStubGraph } from "../../../agents/graph";
import { TaskBoard } from "@/components/task-board";
import { PageHeader, PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";

export const metadata = { title: "任务" };

export default function TasksPage() {
  const graph = runStubGraph([2025, 2026]);
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="tasks.kicker" />} title={<Tr k="tasks.title" />} lede={<Tr k="tasks.lede" />} />
      <TaskBoard stages={graph.nodes} />
    </PageMain>
  );
}
