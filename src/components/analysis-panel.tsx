"use client";

import { useState } from "react";
import type { SeriesAnalysis, SingleImageAnalysis } from "@/lib/data/types";
import { InferenceMark } from "./marks";

const singleFields = [
  ["基础视觉描述", "basicDescription"],
  ["主体与场景", "subjectScene"],
  ["构图", "composition"],
  ["光线", "light"],
  ["色彩", "color"],
  ["视觉重心", "visualWeight"],
  ["空间层次", "spatialDepth"],
  ["情绪", "mood"],
  ["叙事", "narrative"],
  ["主题", "theme"],
  ["视觉独特性", "uniqueness"],
  ["技术表现", "technique"],
] as const;

const seriesFields = [
  ["系列叙事连贯性", "narrativeCoherence"],
  ["视觉统一性", "visualUnity"],
  ["图片之间的关系", "imageRelations"],
  ["主题发展", "themeDevelopment"],
  ["组图节奏", "pacing"],
  ["整体表达完整度", "completeness"],
] as const;

export function AnalysisPanel({
  analysis,
  endpoint,
}: {
  analysis: SingleImageAnalysis | SeriesAnalysis;
  endpoint: string;
}) {
  const [current, setCurrent] = useState(analysis);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fields = current.schema === "single_image" ? singleFields : seriesFields;

  async function run() {
    setPending(true);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const body = (await response.json()) as { message?: string; analysis?: SingleImageAnalysis | SeriesAnalysis };
      setMessage(body.message ?? "已返回");
      if (body.analysis) setCurrent(body.analysis);
    } catch {
      setMessage("请求没有完成");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <InferenceMark />
          <h2 className="text-xl">{current.schema === "single_image" ? "单张视觉分析" : "系列视觉分析"}</h2>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={pending}
          className="rounded-full bg-amber-900 px-3 py-1.5 text-xs text-amber-50 disabled:opacity-60"
        >
          {pending ? "请求中" : "读取已生成的说明证据"}
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-amber-950">{current.evidenceNote}</p>
      {message ? <p className="mt-2 text-xs leading-5 text-amber-950">{message}</p> : null}
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {fields.map(([label, key]) => {
          const raw = (current as unknown as Record<string, unknown>)[key];
          const value = typeof raw === "string" ? raw : null;
          const quotes = current.evidence.filter((item) => item.dimension === key);
          return (
            <div key={label} className="rounded-xl bg-white/70 px-3 py-2">
              <dt className="text-[11px] tracking-wide text-amber-900/80">{label}</dt>
              <dd className="text-sm">{value ?? <span className="text-stone-500">未分析</span>}</dd>
              {quotes.map((item) => (
                <blockquote key={item.quote} className="mt-2 border-l-2 border-amber-900/30 pl-2 text-xs leading-5 text-amber-950">
                  {item.quote}
                </blockquote>
              ))}
            </div>
          );
        })}
      </dl>
      <p className="mt-3 text-xs text-amber-950/80">
        置信度 {current.confidence ?? "—"} · 模型 {current.modelName ?? "未配置"} {current.modelVersion ?? ""} · 分析时间{" "}
        {current.analyzedAt ?? "—"} · 证据 {current.evidence.length} 条 · 未读像素
      </p>
    </section>
  );
}
