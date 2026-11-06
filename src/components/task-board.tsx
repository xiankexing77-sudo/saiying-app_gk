"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import type { AgentTask } from "@/lib/data/types";
import { translate } from "@/lib/i18n/messages";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";

type Stage = { stage: string; status: string; summary: string };

export function TaskBoard({ stages }: { stages: Stage[] }) {
  const { m } = useI18n();
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([2025, 2026]);
  const [shortlists, setShortlists] = useState(false);
  const statusLabel: Record<AgentTask["status"], string> = {
    queued: m.tasks.queued,
    running: m.tasks.running,
    succeeded: m.tasks.succeeded,
    failed: m.tasks.failed,
    blocked: m.tasks.blocked,
  };

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
    setMessage(
      body.message ??
        (body.created
          ? translate(m, "tasks.fallbackCreated", { id: body.task?.id ?? "" })
          : translate(m, "tasks.fallbackExisting", { id: body.task?.id ?? "" })),
    );
    await refresh();
  }

  async function retry(id: string) {
    const response = await fetch(`/api/v1/tasks/${id}/retry`, { method: "POST" });
    const body = (await response.json()) as { message?: string };
    setMessage(body.message ?? m.tasks.retryDone);
    await refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <div className="glass-table">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="font-medium">{m.tasks.colTask}</th>
                <th className="font-medium">{m.tasks.colStatus}</th>
                <th className="font-medium">{m.tasks.colProgress}</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-border">
                  <td>
                    <Link href={`/tasks/${task.id}`} className="font-medium underline-offset-2 hover:underline">
                      {task.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{task.stage}</p>
                  </td>
                  <td>
                    <div>{statusLabel[task.status]}</div>
                    {task.status === "blocked" || task.status === "failed" ? (
                      <button type="button" className="mt-2 inline-flex items-center gap-2 text-xs underline" onClick={() => void retry(task.id)}>
                        <LinearIcon icon={RotateCcw} size={14} />
                        {m.tasks.retry}
                      </button>
                    ) : null}
                  </td>
                  <td className="font-num text-xs">
                    {task.completed}/{task.total}
                    {task.failed ? ` · ${translate(m, "tasks.failedCount", { n: task.failed })}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {message ? <p className="mt-4 text-sm">{message}</p> : null}
      </section>
      <aside className="flex flex-col gap-4">
        <form
          className="glass glass-ember p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void createTask();
          }}
        >
          <h2 className="text-xl font-medium">{m.tasks.newTitle}</h2>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">{m.tasks.newBody}</p>
          <div className="mt-4 flex gap-4 text-sm">
            {[2025, 2026].map((year) => (
              <label key={year} className="flex items-center gap-2">
                <input type="checkbox" checked={years.includes(year)} onChange={() => toggleYear(year)} />
                <span className="font-num">{year}</span>
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={shortlists} onChange={(event) => setShortlists(event.target.checked)} />
            {m.tasks.shortlist}
          </label>
          <button type="submit" className="btn-glow mt-4">
            <LinearIcon icon={Plus} />
            {m.tasks.create}
          </button>
        </form>
        <ol className="glass glass-cobalt flex flex-col gap-4 p-6 text-sm">
          {stages.map((stage) => (
            <li key={stage.stage}>
              <span className="font-medium">{stage.stage}</span>
              <span className="ml-2 font-num text-xs text-muted-foreground">{stage.status}</span>
              <p className="text-xs leading-6 text-muted-foreground">{stage.summary}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
