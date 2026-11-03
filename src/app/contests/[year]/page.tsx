import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WorkBrowser, type WorkCardModel } from "@/components/work-browser";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAwardsForWork,
  getCategories,
  getContest,
  getWorksByYear,
  isEditionYear,
  searchBlob,
} from "@/lib/catalog";
import { AWARD_TYPES, type EditionYear } from "@/lib/types";

export function generateStaticParams() {
  return [{ year: "2025" }, { year: "2026" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  return { title: `${year} 获奖作品` };
}

export default function ContestPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  return (
    <Suspense fallback={<ListFallback />}>
      <ContestBody params={params} />
    </Suspense>
  );
}

async function ContestBody({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!isEditionYear(year)) notFound();
  const edition = Number(year) as EditionYear;
  const contest = getContest(edition);
  if (!contest) notFound();
  const categories = getCategories();
  const cards: WorkCardModel[] = getWorksByYear(edition).map((work) => {
    const category = categories.find((item) => item.id === work.category_id);
    const awardTypes = getAwardsForWork(work.id).map((award) => award.award_type);
    const alias = work.name_aliases.map((item) => item.name).join(" / ");
    return {
      id: work.id,
      title: work.title,
      photographer: work.photographer,
      aliasLine: alias,
      categoryId: work.category_id,
      categoryName: category?.name_zh ?? "来源页暂无",
      awardTypes,
      phone: work.phone_model,
      likeCount: work.like_count,
      excellent: Boolean(work.is_excellent) && !work.is_award_winning,
      search: searchBlob(work),
    };
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href="/" className="hover:underline">
          赛影
        </Link>
        {" / "}
        {edition}
      </p>
      <div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-4xl">{edition} 获奖作品</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {contest.status_note}
          </p>
        </div>
        <Link href={`/contests/${edition}/overview`} className="text-sm text-primary">
          看这一届的结构概览
        </Link>
      </div>
      <div className="mt-6">
        <WorkBrowser
          works={cards}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name_zh,
          }))}
          awardTypes={[...AWARD_TYPES]}
        />
      </div>
    </main>
  );
}

function ListFallback() {
  return (
    <main className="mx-auto max-w-5xl space-y-3 px-4 py-8">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </main>
  );
}
