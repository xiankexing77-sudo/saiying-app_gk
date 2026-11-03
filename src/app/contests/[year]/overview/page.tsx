import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnalysis, getContest, getStats, isEditionYear } from "@/lib/catalog";
import { Skeleton } from "@/components/ui/skeleton";
import type { EditionYear } from "@/lib/types";

export function generateStaticParams() {
  return [{ year: "2025" }, { year: "2026" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return { title: `${year} 届次概览` };
}

export default function OverviewPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-40" />}>
      <OverviewBody params={params} />
    </Suspense>
  );
}

async function OverviewBody({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  if (!isEditionYear(year)) notFound();
  const edition = Number(year) as EditionYear;
  const contest = getContest(edition);
  const stats = getStats(edition);
  const analysis = getAnalysis("edition", year, "edition_overview");
  if (!contest || !analysis) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href={`/contests/${edition}`} className="hover:underline">
          {edition} 作品
        </Link>
        {" / 概览"}
      </p>
      <h1 className="mt-3 font-serif text-4xl">{edition} 届次概览</h1>
      <p className="mt-3 text-sm text-muted-foreground">{contest.status_note}</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.byCategory.map((item) => (
          <div key={item.name_zh} className="rounded-2xl border p-3">
            <p className="text-xs text-muted-foreground">{item.name_zh}</p>
            <p className="font-serif text-2xl">{item.count}</p>
          </div>
        ))}
      </div>
      <article className="mt-6 rounded-2xl border bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <p className="text-xs font-medium">推断 · 结构概览</p>
        <p className="mt-2">{analysis.summary}</p>
      </article>
      <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
        {stats.byAward.map((item) => (
          <li key={item.award_type}>
            {item.award_type} · {item.count}
          </li>
        ))}
      </ul>
    </main>
  );
}
