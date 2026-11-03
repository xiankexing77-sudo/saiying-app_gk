import Link from "next/link";
import { Suspense } from "react";
import { TaskDetail } from "@/components/task-detail";
import { PageHeader, PageMain } from "@/components/page-header";
import { seedTask } from "@/lib/tasks";
import { database } from "@/lib/data/seed";

export function generateStaticParams() {
  return database.tasks.map((task) => ({ id: task.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在读取任务…</PageMain>}>
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initial = seedTask(id);
  return (
    <PageMain>
      <PageHeader kicker="Task" title={initial?.title ?? "任务"} lede="状态来自任务接口。新建任务在服务进程内有效，重启后回到种子任务。" />
      <TaskDetail id={id} />
      <p className="mt-4 text-sm">
        <Link href="/tasks" className="underline">
          返回任务列表
        </Link>
      </p>
    </PageMain>
  );
}
