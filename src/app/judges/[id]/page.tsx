import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StyleCard } from "@/components/style-card";
import { UserPanel } from "@/components/user-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalysis, getJudge, getJudgeYears, getJudges } from "@/lib/catalog";
import { MISSING } from "@/lib/types";

export function generateStaticParams() {
  return getJudges().map((judge) => ({ id: judge.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const judge = getJudge(id);
  return { title: judge?.name ?? "评委" };
}

export default function JudgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-64" />}>
      <JudgeBody params={params} />
    </Suspense>
  );
}

async function JudgeBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const judge = getJudge(id);
  const analysis = judge ? getAnalysis("judge", judge.id, "style") : null;
  if (!judge || !analysis) notFound();
  const years = getJudgeYears(judge.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/judges" className="hover:underline">
          评委
        </Link>
      </p>
      <h1 className="mt-3 font-serif text-4xl">{judge.name}</h1>
      <p className="mt-2 text-sm">{judge.role}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        届次：{years.join("、")} · {judge.locale_note}
      </p>
      <p className="mt-3 text-sm">
        <a href={judge.source_url} className="underline" target="_blank" rel="noreferrer">
          中文区 Photo Awards 来源页
        </a>
      </p>
      {!judge.bio_official.trim() ? (
        <p className="mt-3 text-sm text-muted-foreground">
          完整简介原文：{MISSING}。角色一栏来自页上角色要点，不拿站外履历填空。
        </p>
      ) : null}
      <div className="mt-6">
        <StyleCard initial={analysis} />
      </div>
      <div className="mt-8">
        <UserPanel targetType="judge" targetId={judge.id} sourceUrl={judge.source_url} />
      </div>
    </main>
  );
}
