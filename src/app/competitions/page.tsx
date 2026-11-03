import Link from "next/link";
import { getCompetition, listEditions } from "@/lib/catalog";
import { PageHeader, PageMain } from "@/components/page-header";
import { ProvenanceLine } from "@/components/provenance";

export const metadata = { title: "赛事" };

export default function CompetitionsPage() {
  const competition = getCompetition();
  const editions = listEditions();
  return (
    <PageMain>
      <PageHeader kicker="Competitions" title="赛事" lede="首期只有 Sony World Photography Awards。进入赛事后可以按届次查看组别、获奖记录和评委。" />
      <article className="mt-8 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">{competition.nameZh}</p>
        <h2 className="mt-2 text-3xl">{competition.name}</h2>
        <p className="mt-2 text-sm">{competition.organizer}</p>
        <a className="mt-3 inline-block text-sm underline" href={competition.homepageUrl}>
          官方赛事页
        </a>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {editions.map((edition) => (
            <Link key={edition.id} href={`/editions/${edition.id}`} className="rounded-xl border border-border px-4 py-4 hover:border-stone-500">
              <p className="text-xs text-stone-500">第 {edition.editionNumber} 届</p>
              <p className="mt-1 text-2xl">{edition.year}</p>
              <p className="text-sm text-stone-600">{edition.winnersComplete ? "获奖结果已公布" : "获奖结果未完整"}</p>
            </Link>
          ))}
        </div>
        <ProvenanceLine provenance={competition.provenance} />
      </article>
    </PageMain>
  );
}
