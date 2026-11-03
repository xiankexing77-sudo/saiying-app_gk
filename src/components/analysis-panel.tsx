import type { ReactNode } from "react";
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
  schema,
  evidenceNote,
  action,
}: {
  schema: "single_image" | "series";
  evidenceNote: string;
  action?: ReactNode;
}) {
  const fields = schema === "single_image" ? singleFields : seriesFields;
  return (
    <section className="rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <InferenceMark />
          <h2 className="text-xl">{schema === "single_image" ? "单张视觉分析" : "系列视觉分析"}</h2>
        </div>
        {action}
      </div>
      <p className="mt-3 text-sm leading-6 text-amber-950">{evidenceNote}</p>
      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {fields.map(([label]) => (
          <div key={label} className="rounded-xl bg-white/70 px-3 py-2">
            <dt className="text-[11px] tracking-wide text-amber-900/80">{label}</dt>
            <dd className="text-sm text-stone-500">未分析</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-amber-950/80">置信度 — · 模型未配置 · 分析时间 —</p>
    </section>
  );
}
