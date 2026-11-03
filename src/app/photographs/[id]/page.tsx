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
import { awardsFor, getCategory, getEdition, getImageAsset, getPhotograph, listPhotographs, listTracks, photographersByIds, singleAnalysis } from "@/lib/catalog";
import { displayTitle } from "@/lib/labels";

export function generateStaticParams() {
  return listPhotographs()
    .filter((photo) => photo.role === "standalone")
    .map((photo) => ({ id: photo.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在打开作品…</PageMain>}>
      <Photograph params={params} />
    </Suspense>
  );
}

async function Photograph({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = getPhotograph(id);
  if (!photo || photo.role !== "standalone") notFound();
  const category = getCategory(photo.categoryId);
  const edition = getEdition(photo.editionId);
  const people = photographersByIds(photo.photographerIds);
  const awards = awardsFor({ photographId: photo.id });
  const asset = getImageAsset(photo.imageAssetId);
  const analysis = singleAnalysis(photo.id);
  const track = listTracks(photo.editionId).find((item) => item.normalizedTrack === category?.normalizedTrack);
  return (
    <PageMain>
      <PageHeader kicker="Single image" title={displayTitle(photo.title)} lede={people.map((person) => person.name).join("、")} />
      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <RightsPlaceholder label={displayTitle(photo.title)} />
        <section className="rounded-2xl border border-teal-900/15 bg-white/70 p-5">
          <FactMark />
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="届次" value={edition ? `${edition.year}` : "—"} />
            <Row label="官方赛制" value={track?.rawName ?? "—"} />
            <Row label="规范化赛制" value={track?.normalizedLabel ?? "—"} />
            <Row label="官方组别" value={category?.rawName ?? "—"} />
            <Row label="规范化组别" value={category?.normalizedName ?? "—"} />
            <Row label="奖项" value={awards.map((item) => item.award.name).join(" · ") || "—"} />
            <Row label="图片权限" value={asset?.rightsStatus ?? "rights_blocked"} />
          </dl>
          {people.map((person) =>
            person.nameNote ? (
              <p key={person.id} className="mt-3 text-xs leading-5 text-stone-600">
                {person.name}：{person.nameNote}
              </p>
            ) : null,
          )}
          <h2 className="mt-5 text-lg">作品说明</h2>
          <p className="mt-2 text-sm leading-6">{photo.description ?? "来源页暂无作品说明。"}</p>
          <p className="mt-3 text-sm">
            <a className="underline" href={photo.officialPageUrl}>
              官方页面
            </a>
          </p>
          <ProvenanceLine provenance={photo.provenance} />
        </section>
      </div>
      {edition ? <WorkValidation workId={photo.id} year={edition.year} /> : null}
      {analysis ? (
        <div className="mt-6">
          <AnalysisPanel
            schema="single_image"
            evidenceNote={analysis.evidenceNote}
            action={<RequestAnalysis url={`/api/v1/photographs/${photo.id}/analyze`} label="请求分析" />}
          />
        </div>
      ) : null}
      <p className="mt-4 text-xs text-stone-500">
        <Link href="/photographs">返回作品库</Link>
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
