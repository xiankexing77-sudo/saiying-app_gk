"use client";

import { useEffect, useState } from "react";
import type { AgentTask } from "@/lib/data/types";

export function TaskDetail({ id }: { id: string }) {
  const [task, setTask] = useState<AgentTask | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const response = await fetch(`/api/v1/tasks/${id}`);
        if (response.status === 404) {
          setMissing(true);
          return;
        }
        const body = (await response.json()) as { task: AgentTask };
        setTask(body.task);
      })();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id]);

  async function retry() {
    const response = await fetch(`/api/v1/tasks/${id}/retry`, { method: "POST" });
    const body = (await response.json()) as { message?: string; task?: AgentTask };
    setMessage(body.message ?? null);
    if (body.task) setTask(body.task);
  }

  if (missing) return <p>没有这个任务。</p>;
  if (!task) return <p className="text-sm text-stone-500">正在读取任务状态…</p>;

  return (
    <article className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm">
      <p>状态：{task.status}</p>
      <p className="mt-1">阶段：{task.stage}</p>
      <p className="mt-1">
        进度 {task.completed} / {task.total}，失败 {task.failed}
      </p>
      <p className="mt-1">当前对象：{task.currentItem ?? "—"}</p>
      <p className="mt-1">开始：{task.startedAt ?? "—"}</p>
      <p>结束：{task.finishedAt ?? "—"}</p>
      {task.errorLog.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5">
          {task.errorLog.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {task.status === "blocked" || task.status === "failed" ? (
        <button type="button" className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-stone-50" onClick={() => void retry()}>
          重试
        </button>
      ) : null}
      {message ? <p className="mt-3">{message}</p> : null}
    </article>
  );
}
