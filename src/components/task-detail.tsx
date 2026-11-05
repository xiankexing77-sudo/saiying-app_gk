"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import type { AgentTask } from "@/lib/data/types";
import { translate } from "@/lib/i18n/messages";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";

export function TaskDetail({ id }: { id: string }) {
  const { m } = useI18n();
  const [task, setTask] = useState<AgentTask | null>(null);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    async function load() {
      const response = await fetch(`/api/v1/tasks/${id}`);
      if (stopped) return;
      if (response.status === 404) {
        setMissing(true);
        return;
      }
      const body = (await response.json()) as { task: AgentTask };
      setTask(body.task);
    }
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const poll = window.setInterval(() => {
      void load();
    }, 1200);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      window.clearInterval(poll);
    };
  }, [id]);

  async function retry() {
    const response = await fetch(`/api/v1/tasks/${id}/retry`, { method: "POST" });
    const body = (await response.json()) as { message?: string; task?: AgentTask };
    setMessage(body.message ?? null);
    if (body.task) setTask(body.task);
  }

  if (missing) return <p>{m.tasks.missing}</p>;
  if (!task) return <p className="text-sm text-muted-foreground">{m.tasks.loading}</p>;
  const statusLabel = {
    queued: m.tasks.queued,
    running: m.tasks.running,
    succeeded: m.tasks.succeeded,
    failed: m.tasks.failed,
    blocked: m.tasks.blocked,
  }[task.status];

  return (
    <article className="glass glass-cobalt mt-8 p-6 text-sm">
      <p>
        {m.tasks.statusLine}：{statusLabel}
      </p>
      <p className="mt-2">
        {m.tasks.stageLine}：{task.stage}
      </p>
      <p className="font-num mt-2">{translate(m, "tasks.progressLine", { done: task.completed, total: task.total, failed: task.failed })}</p>
      <p className="mt-2">
        {m.tasks.current}：{task.currentItem ?? "—"}
      </p>
      <p className="mt-2">
        {m.tasks.started}：{task.startedAt ?? "—"}
      </p>
      <p>
        {m.tasks.finished}：{task.finishedAt ?? "—"}
      </p>
      {task.stages.length ? (
        <ol className="mt-4 space-y-2">
          {task.stages.map((stage) => (
            <li key={`${stage.stage}-${stage.summary}`}>
              <span className="font-medium">{stage.stage}</span>
              <span className="ml-2 text-xs text-stone-500">{stage.status}</span>
              <p className="text-xs leading-5 text-stone-600">{stage.summary}</p>
            </li>
          ))}
        </ol>
      ) : null}
      {task.errorLog.length ? (
        <ul className="mt-4 list-disc space-y-1 pl-5">
          {task.errorLog.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      {task.status === "blocked" || task.status === "failed" ? (
        <button type="button" className="btn-glow mt-4" onClick={() => void retry()}>
          <LinearIcon icon={RotateCcw} />
          {m.tasks.retry}
        </button>
      ) : null}
      {message ? <p className="mt-4">{message}</p> : null}
    </article>
  );
}
