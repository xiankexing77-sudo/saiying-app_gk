"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadDb,
  overrideFor,
  saveAnalysisOverride,
  serverSnapshot,
  subscribe,
} from "@/lib/user-store";
import { DISCLAIMER, type AnalysisResult } from "@/lib/types";

export function AnalysisView({ initial }: { initial: AnalysisResult }) {
  const db = useSyncExternalStore(subscribe, loadDb, serverSnapshot);
  const stored = overrideFor(db, initial.target_type, initial.target_id, initial.kind);
  const result = stored ?? initial;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: initial.target_type,
          target_id: initial.target_id,
          kind: initial.kind,
        }),
      });
      if (!response.ok) throw new Error("failed");
      const next = (await response.json()) as AnalysisResult;
      saveAnalysisOverride(next);
    } catch {
      setError("这次没有生成成功。上一次的卡片还在，可以再试。");
    } finally {
      setLoading(false);
    }
  }

  const evidence = result.evidence_json;

  return (
    <article className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-950">
          推断 · {DISCLAIMER}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={retry} disabled={loading}>
          {loading ? "正在整理…" : "重新生成"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : result.status === "failed" ? (
        <p className="rounded-2xl border border-dashed p-6 text-sm">{result.summary}</p>
      ) : (
        <div className="space-y-4">
          {evidence.zeiss_path ? (
            <p className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
              蔡司专业风格奖走蔡司评委的独立终审路径，和六个单元的主赛不是同一条路。
            </p>
          ) : null}
          <ol className="space-y-3">
            {(evidence.points ?? []).map((point) => (
              <li
                key={point}
                className="rounded-2xl border bg-card p-4 text-sm leading-7"
              >
                {point}
              </li>
            ))}
          </ol>
          {evidence.exercises && evidence.exercises.length > 0 ? (
            <section className="rounded-2xl bg-muted/70 p-4">
              <h2 className="text-sm font-medium">可以练的几步</h2>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6">
                {evidence.exercises.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
            </section>
          ) : null}
          <p className="text-sm leading-6 text-muted-foreground">
            页面上的点赞只是读者点过一次心，不能拿来解释它为什么入选。
          </p>
          <details className="text-xs leading-5 text-muted-foreground">
            <summary className="cursor-pointer">这条推断用了哪些公开字段</summary>
            <pre className="mt-2 overflow-auto rounded-xl bg-muted p-3">
              {JSON.stringify(evidence, null, 2)}
            </pre>
          </details>
          <p className="text-[11px] text-muted-foreground">
            {result.model_meta.engine} · {result.model_meta.prompt_version} · {result.created_at}
            {result.model_meta.regenerated ? " · 已重新整理" : ""}
          </p>
        </div>
      )}
    </article>
  );
}
