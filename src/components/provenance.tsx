import type { Provenance } from "@/lib/data/types";
import { FactMark } from "./marks";

export function ProvenanceLine({ provenance }: { provenance: Provenance }) {
  return (
    <div className="mt-4 rounded-xl border border-teal-900/10 bg-white/60 p-3 text-xs leading-5 text-stone-600">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <FactMark>来源</FactMark>
        <span>{provenance.sourcePageTitle}</span>
      </div>
      <a className="break-all text-teal-900 underline-offset-2 hover:underline" href={provenance.sourceUrl}>
        {provenance.sourceUrl}
      </a>
      <p className="mt-1">
        记录时间 {provenance.fetchedAt} · 解析 {provenance.parserVersion} · 抽取 {provenance.extractionVersion}
        {provenance.contentHash ? ` · hash ${provenance.contentHash}` : " · 未保存原文哈希"}
      </p>
    </div>
  );
}
