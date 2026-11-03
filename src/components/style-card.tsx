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
import { MISSING, type AnalysisResult } from "@/lib/types";

export function StyleCard({ initial }: { initial: AnalysisResult }) {
  const db = useSyncExternalStore(subscribe, loadDb, serverSnapshot);
  const stored = overrideFor(db, initial.target_type, initial.target_id, initial.kind);
  const result = stored ?? initial;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const official = result.evidence_json.official_column || MISSING;
  const inferred = result.evidence_json.inferred_column || result.summary;

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
      saveAnalysisOverride((await response.json()) as AnalysisResult);
    } catch {
      setError("这次没有整理成功。上一次的风格卡还在。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">风格卡</h2>
        <Button type="button" size="sm" variant="outline" onClick={retry} disabled={loading}>
          {loading ? "正在整理…" : "重新生成"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-medium text-sky-900">官网原文</p>
            <h3 className="mt-2 text-sm font-medium">官网简介原文</h3>
            <p className="mt-2 text-sm leading-7">{official}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-950">推断</p>
            <h3 className="mt-2 text-sm font-medium">学习向偏好</h3>
            <p className="mt-2 text-sm leading-7">{inferred}</p>
            {result.evidence_json.tags ? (
              <ul className="mt-3 flex flex-wrap gap-1">
                {result.evidence_json.tags.map((tag) => (
                  <li key={tag} className="rounded-full bg-white/80 px-2 py-0.5 text-[11px]">
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>
      )}
    </section>
  );
}
