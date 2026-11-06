"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, TriangleAlert } from "lucide-react";
import type { AgentTask } from "@/lib/data/types";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";

export function StageBRun() {
  const { m } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(injectFailureWorkId: string | null) {
    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/v1/stage-b/research", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        years: [2025, 2026],
        forceRefresh: Boolean(injectFailureWorkId),
        injectFailureWorkId,
      }),
    });
    const body = (await response.json()) as { message?: string; task?: AgentTask };
    setMessage(body.message ?? null);
    const id = body.task?.id ?? null;
    setTaskId(id);
    if (id) {
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const taskResponse = await fetch(`/api/v1/tasks/${id}`);
        if (!taskResponse.ok) break;
        const taskBody = (await taskResponse.json()) as { task: AgentTask };
        if (taskBody.task.status !== "queued" && taskBody.task.status !== "running") break;
      }
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-glow" disabled={busy} onClick={() => void run(null)}>
          <LinearIcon icon={Play} />
          {m.stageB.run}
        </button>
        <button type="button" className="inline-flex items-center gap-2 text-sm underline disabled:opacity-50" disabled={busy} onClick={() => void run("single-2025-architecture")}>
          <LinearIcon icon={TriangleAlert} />
          {m.stageB.failDemo}
        </button>
        <a className="text-sm underline" href="/api/v1/stage-b/report?download=1">
          {m.stageB.export}
        </a>
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      {taskId ? (
        <Link href={`/tasks/${taskId}`} className="text-xs underline">
          {m.stageB.taskLink}
        </Link>
      ) : null}
    </div>
  );
}
