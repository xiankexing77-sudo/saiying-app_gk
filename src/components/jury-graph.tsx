import type { juryResearchGraph } from "@/lib/jury-graph";
import { FactMark, InferenceMark } from "./marks";

type Graph = NonNullable<ReturnType<typeof juryResearchGraph>>;

const kindLabel = {
  jury: "评委",
  edition: "届次职务",
  sample_group: "本人作品",
  style_tag: "风格标签",
  quote: "公开引语",
} as const;

export function JuryGraph({ graph }: { graph: Graph }) {
  return (
    <section className="mt-8 rounded-2xl border border-border bg-white/70 p-5">
      <h2 className="text-2xl">研究关系</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        这里只画已经采集到的关系。空白字段留在缺口里，不连到获奖作品。
      </p>
      <ul className="mt-4 space-y-3">
        {graph.edges.map((edge) => {
          const from = graph.nodes.find((node) => node.id === edge.from);
          const to = graph.nodes.find((node) => node.id === edge.to);
          return (
            <li key={`${edge.from}-${edge.relation}-${edge.to}`} className="rounded-xl border border-border bg-white px-3 py-3 text-sm">
              <p>
                <span className="text-stone-500">{from ? kindLabel[from.kind] : ""}</span> {from?.label}{" "}
                <span className="text-teal-900">— {edge.relation} →</span>{" "}
                <span className="text-stone-500">{to ? kindLabel[to.kind] : ""}</span> {to?.label}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs leading-5 text-stone-600">
                {to?.tone === "inference" || from?.tone === "inference" ? <InferenceMark /> : <FactMark />}
                {edge.boundary}
              </p>
            </li>
          );
        })}
      </ul>
      <h3 className="mt-5 text-lg">还没有的事实</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-stone-600">
        {graph.gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
      <h3 className="mt-5 text-lg">明确不存在的边</h3>
      <ul className="mt-2 list-disc pl-5 text-sm text-stone-600">
        {graph.absent.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}
