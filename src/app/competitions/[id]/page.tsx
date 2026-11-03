import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ENTRY_ALLOWLIST } from "../../../../collectors/sony/allowlist";
import { getCompetition, listEditions, listTracks } from "@/lib/catalog";
import { PageHeader, PageMain } from "@/components/page-header";

export function generateStaticParams() {
  return [{ id: "swpa" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: id === "swpa" ? "SWPA" : "赛事" };
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在打开赛事…</PageMain>}>
      <Competition params={params} />
    </Suspense>
  );
}

async function Competition({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = getCompetition();
  if (id !== competition.id) notFound();
  const editions = listEditions();
  return (
    <PageMain>
      <PageHeader
        kicker={competition.nameZh}
        title={competition.name}
        lede="采集从官方入口清单起步。下面的届次、组别和评委来自已核对种子，不是这次请求当场抓取的。"
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {editions.map((edition) => (
          <section key={edition.id} className="rounded-2xl border border-border bg-card p-5">
            <Link href={`/editions/${edition.id}`} className="text-2xl underline-offset-2 hover:underline">
              {edition.year}
            </Link>
            <ul className="mt-3 space-y-2 text-sm">
              {listTracks(edition.id).map((track) => (
                <li key={track.id} className="flex flex-wrap justify-between gap-2 border-b border-border/70 py-2">
                  <span>{track.rawName}</span>
                  <span className="text-stone-500">
                    {track.normalizedLabel} · {track.workForm === "series" ? "系列结构" : "单张结构"}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-white/60 p-5">
        <h2 className="text-xl">官方入口清单</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {ENTRY_ALLOWLIST.map((url) => (
            <li key={url}>
              <a className="break-all underline" href={url}>
                {url}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageMain>
  );
}
