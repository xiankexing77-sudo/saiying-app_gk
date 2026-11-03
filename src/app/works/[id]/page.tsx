import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { UserPanel } from "@/components/user-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAwardsForWork,
  getCategory,
  getContest,
  getJudgesByYear,
  getWork,
  getWorks,
} from "@/lib/catalog";
import { MISSING } from "@/lib/types";

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
  return { title: work ? work.title : "作品" };
}

export default function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<Skeleton className="m-8 h-64" />}>
      <WorkBody params={params} />
    </Suspense>
  );
}

async function WorkBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = getWork(id);
  if (!work) notFound();
  const category = getCategory(work.category_id);
  const awards = getAwardsForWork(work.id);
  const contest = getContest(work.year);
  const judges = getJudgesByYear(work.year);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-xs text-muted-foreground">
        <Link href={`/contests/${work.year}`} className="hover:underline">
          {work.year} 获奖作品
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {awards.map((award) => (
          <span key={award.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {award.award_type}
          </span>
        ))}
      </div>
      <h1 className="mt-3 font-serif text-4xl leading-tight">{work.title}</h1>
      {work.title_aliases.length > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          其他公开标题：{work.title_aliases.join("、")}
        </p>
      ) : null}
      <p className="mt-3 text-lg">
        {work.photographer ?? MISSING}
        {work.photographer_source ? (
          <span className="ml-2 text-xs text-muted-foreground">{work.photographer_source}</span>
        ) : null}
      </p>
      {work.name_aliases.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {work.name_aliases.map((alias) => (
            <li key={alias.name}>
              {alias.name}
              <span className="ml-2 text-xs">· {alias.source}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Fact label="题材" value={category?.name_zh ?? MISSING} hint={work.gallery_unit_name !== category?.name_zh ? `官网单元名：${work.gallery_unit_name}` : undefined} />
        <Fact label="机型" value={work.phone_model ?? MISSING} hint={work.phone_note ?? undefined} />
        <Fact label="点赞" value={work.like_count === null ? MISSING : String(work.like_count)} hint="点赞，不是评分" />
        <Fact label="分享" value={work.share_count === null ? MISSING : String(work.share_count)} />
      </dl>

      <section className="mt-6 rounded-2xl border p-4">
        <p className="text-xs font-medium text-sky-900">官网原文</p>
        <h2 className="mt-1 text-sm font-medium">作品说明</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-7">
          {work.description ?? MISSING}
        </p>
      </section>

      {awards.some((award) => award.rank_hint) ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {awards
            .filter((award) => award.rank_hint)
            .map((award) => (
              <li key={award.id}>
                {award.award_type}：{award.rank_hint}（官网英文名 {award.official_name_en}）
              </li>
            ))}
        </ul>
      ) : null}

      {work.public_notes.length > 0 ? (
        <section className="mt-4 space-y-2">
          {work.public_notes.map((note) => (
            <p key={note.text} className="rounded-2xl bg-muted p-4 text-sm leading-6">
              <span className="font-medium">{note.label}。 </span>
              {note.text}{" "}
              <a href={note.source_url} className="underline" target="_blank" rel="noreferrer">
                来源
              </a>
            </p>
          ))}
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button render={<Link href={`/works/${work.id}/analysis`} />} className="h-10 px-4">
          阅读入选解读
        </Button>
        <Button
          variant="outline"
          className="h-10 px-4"
          render={
            <a href={work.detail_url} target="_blank" rel="noreferrer" />
          }
        >
          在官网打开
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        外链：{work.detail_path}。赛影不托管原图。
      </p>

      {work.official_comments.length > 0 ? (
        <section className="mt-8 space-y-3">
          <div>
            <p className="text-xs font-medium text-sky-900">官网原文</p>
            <h2 className="font-serif text-2xl">公示页评语</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              下面是官网获奖公示模块里的原句。有署名的按页面署名展示；没有署名的不指认是谁说的。这些句子不是分数，也不表示某一位评委决定了这件作品。推断卡片不会把它们改写成自己的结论。
            </p>
          </div>
          {work.official_comments.map((comment) => (
            <blockquote key={`${comment.speaker ?? "anon"}-${comment.text.slice(0, 24)}`} className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs text-sky-900">
                {comment.source_label}
                {comment.speaker ? ` · ${comment.speaker}` : " · 未署名"}
              </p>
              <p className="mt-2 text-sm leading-7">{comment.text}</p>
            </blockquote>
          ))}
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted-foreground">
          官网评语：{MISSING}。这一届作品集接口没有可用的评语文本，赛影不补写。
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-medium">本届评委席位</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {contest?.status_note} 席位只供对照，不是「谁选了这张」。
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {judges.map((judge) => (
            <li key={judge.id}>
              <Link href={`/judges/${judge.id}`} className="rounded-full border px-3 py-1 text-sm hover:border-primary">
                {judge.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <UserPanel targetType="work" targetId={work.id} sourceUrl={work.detail_url} />
      </div>
    </main>
  );
}

function Fact({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
      {hint ? <dd className="mt-1 text-[11px] leading-4 text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}
