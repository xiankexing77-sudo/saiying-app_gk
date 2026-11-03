import { listSources } from "@/lib/catalog";
import { collectCompetition } from "@/lib/collection";
import { SeedMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";

export const metadata = { title: "来源" };

export default function SourcesPage() {
  const sources = listSources();
  const used = new Set(collectCompetition().editions.flatMap((edition) => edition.sources.map((source) => source.id)));
  return (
    <PageMain>
      <PageHeader
        kicker="Sources"
        title="来源记录"
        lede="每条事实指向这里的一条来源。采集模式仍是 curated_seed：人工核对公开页面后写入，不是实时爬虫。交叉验证会把同一字段在多个已登记来源上的摘录放在一起比较，不另造来源。原文 HTML 与 content hash 还没有保存。"
      />
      <div className="mt-4">
        <SeedMark />
      </div>
      <ul className="mt-6 space-y-3">
        {sources.map((source) => (
          <li key={source.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">{source.pageTitle}</p>
            <a className="mt-1 block break-all text-teal-900 underline" href={source.url}>
              {source.url}
            </a>
            <p className="mt-2 text-xs leading-5 text-stone-600">
              {source.publisher} · {source.collectionMode} · {source.fetchedAt} · {source.parserVersion}
              {used.has(source.id) ? " · 参与交叉验证" : ""}
            </p>
            {source.notes ? <p className="mt-1 text-xs leading-5 text-stone-600">{source.notes}</p> : null}
          </li>
        ))}
      </ul>
    </PageMain>
  );
}
