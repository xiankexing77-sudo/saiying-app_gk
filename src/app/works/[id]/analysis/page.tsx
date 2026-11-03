import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnalysisView } from "@/components/analysis-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalysis, getWork, getWorks } from "@/lib/catalog";

export function generateStaticParams() {
  return getWorks().map((work) => ({ id: work.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = getWork(id);
  return { title: work ? `${work.title}的入选解读` : "入选解读" };
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl space-y-3 px-4 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </main>
      }
    >
      <AnalysisBody params={params} />
    </Suspense>
  );
}

async function AnalysisBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = getWork(id);
  const analysis = work ? getAnalysis("work", work.id, "selection_reason") : null;
  if (!work || !analysis) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href={`/works/${work.id}`} className="hover:underline">
          《{work.title}》
        </Link>
        {" / 入选解读"}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-tight">为何可能入选</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {work.photographer ?? "来源页暂无"} · {work.year}
        {work.name_aliases.some((alias) => alias.name === "歪杰") ? " · 歪杰" : ""}
        {work.photographer === "CHUNLIN" ? " · CHUNLIN" : ""}
      </p>
      <div className="mt-6">
        <AnalysisView initial={analysis} />
      </div>
    </main>
  );
}
