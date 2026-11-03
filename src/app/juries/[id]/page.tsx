import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FactMark, InferenceMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";
import { ProvenanceLine } from "@/components/provenance";
import { RequestAnalysis } from "@/components/request-analysis";
import { getJury, juryAssignments, juryProfile, listJuries, quotesBySpeaker } from "@/lib/catalog";
import { trackZh } from "@/lib/labels";

export function generateStaticParams() {
  return listJuries().map((jury) => ({ id: jury.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在打开评委…</PageMain>}>
      <JuryPage params={params} />
    </Suspense>
  );
}

async function JuryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jury = getJury(id);
  if (!jury) notFound();
  const assignments = juryAssignments(jury.id);
  const profile = juryProfile(jury.id);
  const quotes = quotesBySpeaker(jury.name);
  const inference = profile.inference;
  return (
    <PageMain>
      <PageHeader kicker="Jury" title={jury.name} lede="左侧是可核对的公开资料，右侧是推断。样本不足时右侧保持空白。" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-teal-900/15 bg-white/75 p-5">
          <FactMark>可核实事实</FactMark>
          <h2 className="mt-3 text-2xl">公开身份</h2>
          <ul className="mt-4 space-y-4">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="border-t border-border pt-3">
                <Link href={`/editions/${assignment.editionId}`} className="text-sm underline">
                  {assignment.editionId.replace("swpa-", "")} 届
                </Link>
                <p className="mt-1 text-sm">{assignment.roleTitle}</p>
                <p className="text-xs text-stone-500">
                  {assignment.institution ?? "来源未单列机构"} · {assignment.tracks.map((track) => trackZh(track)).join("、")}
                </p>
                {assignment.biographyExcerpt ? <p className="mt-2 text-sm leading-6">{assignment.biographyExcerpt}</p> : <p className="mt-2 text-sm text-stone-500">这一来源没有更长的简介，页面不补写。</p>}
                <p className="mt-2 text-xs">
                  <a className="underline" href={assignment.officialProfileUrl}>
                    官方评委页
                  </a>
                </p>
                <ProvenanceLine provenance={assignment.provenance} />
              </li>
            ))}
          </ul>
          <h3 className="mt-6 text-lg">尚未采集的事实字段</h3>
          <ul className="mt-2 text-sm text-stone-600">
            <li>教育背景：{profile.facts?.education ?? "来源未给出"}</li>
            <li>公开出版物：{profile.facts?.publications.length ? profile.facts.publications.join("、") : "未采集"}</li>
            <li>采访：{profile.facts?.interviews.length ? "有" : "未采集"}</li>
            <li>作品集：{profile.portfolios[0]?.note}</li>
          </ul>
          {quotes.map(({ quote, series }) => (
            <article key={series.id} className="mt-4 rounded-xl bg-stone-50 p-3">
              <FactMark>公开引语</FactMark>
              <p className="mt-2 text-sm leading-6">{quote.text}</p>
              <p className="mt-2 text-xs leading-5 text-stone-600">{quote.boundary}</p>
              <Link className="text-xs underline" href={`/series/${series.id}`}>
                相关作品：{series.title}
              </Link>
            </article>
          ))}
        </section>
        <section className="rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <InferenceMark />
              <h2 className="text-2xl">研究画像</h2>
            </div>
            <RequestAnalysis url={`/api/v1/juries/${jury.id}/analyze`} label="请求画像" />
          </div>
          {inference?.sampleStatus === "insufficient" ? (
            <p className="mt-4 rounded-xl bg-amber-200/70 px-3 py-2 text-sm">样本不足。公开作品样本数 {inference.sampleCount}。</p>
          ) : null}
          <p className="mt-3 text-sm leading-6">{inference?.statement}</p>
          <dl className="mt-4 grid gap-2 text-sm">
            {[
              ["视觉风格", inference?.visualStyle],
              ["常见题材", inference?.commonSubjects],
              ["色彩倾向", inference?.colorTendency],
              ["构图倾向", inference?.compositionTendency],
              ["叙事偏好", inference?.narrativePreference],
              ["主题表达", inference?.thematicMode],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between rounded-xl bg-white/70 px-3 py-2">
                <dt>{label}</dt>
                <dd className="text-stone-500">{value ?? "未分析"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-amber-950">
            置信度 {inference?.confidence ?? "—"} · 模型 {inference?.modelName ?? "未配置"} · 证据 {inference?.evidence.length ?? 0} 条
          </p>
        </section>
      </div>
      <p className="mt-4 text-sm">
        <Link href="/juries" className="underline">
          返回评委列表
        </Link>
      </p>
    </PageMain>
  );
}
