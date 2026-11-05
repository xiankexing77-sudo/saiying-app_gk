import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { editionSnapshot } from "@/lib/catalog";
import { collectEditionById } from "@/lib/collection";
import { displayTitle, peopleLine, trackZh } from "@/lib/labels";
import { FactMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";
import { ProvenanceLine } from "@/components/provenance";
import { ValidationPanel } from "@/components/validation-panel";

export function generateStaticParams() {
  return [{ id: "swpa-2025" }, { id: "swpa-2026" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: id === "swpa-2025" ? "2025 届" : id === "swpa-2026" ? "2026 届" : "届次" };
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在打开届次…</PageMain>}>
      <Edition params={params} />
    </Suspense>
  );
}

async function Edition({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = editionSnapshot(id);
  if (!snapshot) notFound();
  const validation = collectEditionById(id);
  const { edition, tracks, works, juries, honors, byTrack } = snapshot;
  return (
    <PageMain>
      <PageHeader
        kicker={`Edition ${edition.editionNumber ?? ""}`}
        title={edition.officialLabel}
        lede={edition.submissionNote ?? undefined}
        actions={
          <Link href="/photographs" className="text-sm underline">
            在作品库筛选
          </Link>
        }
      />
      <ProvenanceLine provenance={edition.provenance} />
      {validation ? <ValidationPanel report={validation} limitAgrees /> : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {byTrack.map((row) => (
          <span key={row.track} className="rounded-full border border-border px-3 py-1 text-xs">
            {trackZh(row.track)} {row.count}
          </span>
        ))}
      </div>
      <div className="mt-8 grid gap-4">
        {tracks.map((track) => {
          const rows = works.filter((item) => item.track === track.normalizedTrack);
          return (
            <section key={track.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl">{track.rawName}</h2>
                <p className="text-sm text-stone-500">
                  规范化 {track.normalizedLabel} · {track.workForm === "series" ? "系列" : "单张"} · {track.mappingVersion}
                </p>
              </div>
              <ul className="mt-4 divide-y divide-border">
                {rows.map((item) => (
                  <li key={item.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                      <Link href={item.href} className="text-lg underline-offset-2 hover:underline">
                        {displayTitle(item.title)}
                      </Link>
                      <p className="text-sm text-stone-600">
                        {peopleLine(item.photographers.map((person) => person.name))} · {item.rawCategory}
                      </p>
                    </div>
                    <p className="text-xs text-stone-500">{item.awards.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section className="mt-6 rounded-2xl border border-border bg-white/70 p-5">
        <h2 className="text-2xl">评委</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {juries.map(({ assignment, jury }) => (
            <li key={assignment.id}>
              <Link href={`/juries/${jury.id}`} className="font-medium underline-offset-2 hover:underline">
                {jury.name}
              </Link>
              <p className="text-sm text-stone-600">{assignment.roleTitle}</p>
              <p className="text-xs text-stone-500">{assignment.tracks.map((track) => trackZh(track)).join("、")}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-6 rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2">
          <FactMark />
          <h2 className="text-2xl">非比赛组别荣誉</h2>
        </div>
        {honors.map((honor) => (
          <div key={honor.id} className="mt-3">
            <p className="text-sm">
              {honor.title}：{honor.recipient}
            </p>
            <p className="text-sm text-stone-600">{honor.summary}</p>
            <ProvenanceLine provenance={honor.provenance} />
          </div>
        ))}
      </section>
    </PageMain>
  );
}
