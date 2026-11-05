"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AgentTask } from "@/lib/data/types";

type Stage = { stage: string; status: string; summary: string };

const statusLabel: Record<AgentTask["status"], string> = {
  queued: "排队",
  running: "执行中",
  succeeded: "完成",
  failed: "失败",
  blocked: "阻塞",
};

export function TaskBoard({ stages }: { stages: Stage[] }) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([2025, 2026]);
  const [shortlists, setShortlists] = useState(false);

  async function refresh() {
    const response = await fetch("/api/v1/tasks");
    const body = (await response.json()) as { tasks: AgentTask[] };
    setTasks(body.tasks);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const poll = window.setInterval(() => {
      void refresh();
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
    };
  }, []);

  function toggleYear(year: number) {
    setYears((current) => (current.includes(year) ? current.filter((item) => item !== year) : [...current, year]));
  }

  async function createTask() {
    const response = await fetch("/api/v1/competitions/swpa/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        years,
        scope: {
          winners: true,
          shortlists,
          juries: true,
          juryPortfolios: true,
          imageAnalysis: true,
          reportGeneration: true,
        },
        forceRefresh: false,
      }),
    });
    const body = (await response.json()) as { message?: string; task?: AgentTask; created?: boolean };
    setMessage(body.message ?? (body.created ? `已入队 ${body.task?.id}` : `已有相同任务 ${body.task?.id}`));
    await refresh();
  }

  async function retry(id: string) {
    const response = await fetch(`/api/v1/tasks/${id}/retry`, { method: "POST" });
    const body = (await response.json()) as { message?: string };
    setMessage(body.message ?? "已处理重试");
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-900 text-stone-50">
              <tr>
                <th className="px-3 py-2 font-medium">任务</th>
                <th className="px-3 py-2 font-medium">状态</th>
                <th className="px-3 py-2 font-medium">进度</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-border bg-white/70">
                  <td className="px-3 py-3">
                    <Link href={`/tasks/${task.id}`} className="font-medium underline-offset-2 hover:underline">
                      {task.title}
                    </Link>
                    <p className="text-xs text-stone-500">{task.stage}</p>
                  </td>
                  <td className="px-3 py-3">
                    <div>{statusLabel[task.status]}</div>
                    {task.status === "blocked" || task.status === "failed" ? (
                      <button type="button" className="mt-1 text-xs underline" onClick={() => void retry(task.id)}>
                        重试
                      </button>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {task.completed}/{task.total}
                    {task.failed ? ` · 失败 ${task.failed}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
      </section>
      <aside className="space-y-4">
        <form
          className="rounded-2xl border border-border bg-card p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createTask();
          }}
        >
          <h2 className="text-xl">新建研究任务</h2>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">请求只返回任务 ID，随后在进程内推进。Shortlist 默认关闭；勾上也不会去抓入围名单。</p>
          <div className="mt-3 flex gap-3 text-sm">
            {[2025, 2026].map((year) => (
              <label key={year} className="flex items-center gap-2">
                <input type="checkbox" checked={years.includes(year)} onChange={() => toggleYear(year)} />
                {year}
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shortlists} onChange={(event) => setShortlists(event.target.checked)} />
            包含 Shortlist（仍不会在本 POC 中抓取）
          </label>
          <button type="submit" className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm text-stone-50">
            创建任务
          </button>
        </form>
        <ol className="space-y-2 rounded-2xl border border-border bg-white/50 p-4 text-sm">
          {stages.map((stage) => (
            <li key={stage.stage}>
              <span className="font-medium">{stage.stage}</span>
              <span className="ml-2 text-xs text-stone-500">{stage.status}</span>
              <p className="text-xs leading-5 text-stone-600">{stage.summary}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
