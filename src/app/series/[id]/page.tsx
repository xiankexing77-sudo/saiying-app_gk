import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnalysisPanel } from "@/components/analysis-panel";
import { FactMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";
import { ProvenanceLine } from "@/components/provenance";
import { RequestAnalysis } from "@/components/request-analysis";
import { RightsPlaceholder } from "@/components/rights-placeholder";
import { WorkValidation } from "@/components/validation-panel";
import { awardsFor, getCategory, getEdition, getImageAsset, getSeries, listSeries, listTracks, photographersByIds, seriesAnalysis, seriesFrames } from "@/lib/catalog";
import { displayTitle } from "@/lib/labels";

export function generateStaticParams() {
  return listSeries().map((item) => ({ id: item.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在打开系列…</PageMain>}>
      <SeriesPage params={params} />
    </Suspense>
  );
}

async function SeriesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const series = getSeries(id);
  if (!series) notFound();
  const category = getCategory(series.categoryId);
  const edition = getEdition(series.editionId);
  const people = photographersByIds(series.photographerIds);
  const awards = awardsFor({ seriesId: series.id });
  const asset = getImageAsset(series.imageAssetId);
  const frames = seriesFrames(series.id);
  const analysis = seriesAnalysis(series.id);
  const track = listTracks(series.editionId).find((item) => item.normalizedTrack === category?.normalizedTrack);
  return (
    <PageMain>
      <PageHeader kicker="Series" title={displayTitle(series.title)} lede={people.map((person) => person.name).join("、")} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RightsPlaceholder label={displayTitle(series.title)} />
        <section className="rounded-2xl border border-teal-900/15 bg-white/70 p-5">
          <FactMark />
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="届次" value={edition ? String(edition.year) : "—"} />
            <Row label="官方赛制" value={track?.rawName ?? "—"} />
            <Row label="规范化赛制" value={track?.normalizedLabel ?? "—"} />
            <Row label="官方组别" value={category?.rawName ?? "—"} />
            <Row label="奖项" value={awards.map((item) => item.award.name).join(" · ")} />
            <Row label="系列张数" value={series.imageCount === null ? "未采集" : String(series.imageCount)} />
            <Row label="图片权限" value={asset?.rightsStatus ?? "rights_blocked"} />
          </dl>
          <p className="mt-3 text-xs leading-5 text-stone-600">{series.imageCountNote}</p>
          {people.map((person) =>
            person.nameNote ? (
              <p key={person.id} className="mt-2 text-xs leading-5 text-stone-600">
                {person.name}：{person.nameNote}
              </p>
            ) : null,
          )}
          <h2 className="mt-5 text-lg">系列说明</h2>
          <p className="mt-2 text-sm leading-6">{series.description ?? "来源页暂无系列说明。"}</p>
          <p className="mt-3 text-sm">
            <a className="underline" href={series.officialSourceUrl}>
              官方来源
            </a>
          </p>
          <ProvenanceLine provenance={series.provenance} />
        </section>
      </div>
      {edition ? <WorkValidation workId={series.id} year={edition.year} /> : null}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-2xl">系列中的照片</h2>
        {frames.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-stone-600">这一系列还没有逐帧记录。不编造画幅标题或顺序。</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {frames.map((frame) => (
              <li key={frame.id} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[4rem_1fr]">
                <p className="font-serif text-2xl">{frame.sequenceNumber}</p>
                <div>
                  <h3 className="text-lg">{frame.photograph?.title}</h3>
                  <p className="mt-1 text-sm leading-6">{frame.photograph?.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
      {series.publicQuotes.map((quote) => (
        <section key={quote.text.slice(0, 24)} className="mt-4 rounded-2xl border border-border p-5">
          <FactMark>公开引语</FactMark>
          <p className="mt-3 text-sm leading-6">{quote.text}</p>
          <p className="mt-2 text-xs text-stone-600">
            {quote.speaker}，{quote.role}。{quote.boundary}
          </p>
        </section>
      ))}
      {analysis ? (
        <div className="mt-6">
          <AnalysisPanel
            schema="series"
            evidenceNote={analysis.evidenceNote}
            action={<RequestAnalysis url={`/api/v1/series/${series.id}/analyze`} label="请求系列分析" />}
          />
        </div>
      ) : null}
      <p className="mt-4 text-xs">
        <Link href="/photographs" className="underline">
          返回作品库
        </Link>
      </p>
    </PageMain>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
