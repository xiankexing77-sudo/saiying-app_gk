import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { compareEditions, TRACK_LABEL } from "@/lib/catalog";
import type { NormalizedTrack } from "@/lib/data/types";
import { displayTitle, peopleLine } from "@/lib/labels";
import { FactMark, InferenceMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";

const tracks: NormalizedTrack[] = ["series", "single_image", "student", "youth"];

export function generateStaticParams() {
  return tracks.map((track) => ({ track }));
}

export default function Page({ params }: { params: Promise<{ track: string }> }) {
  return (
    <Suspense fallback={<PageMain>正在整理对照…</PageMain>}>
      <Report params={params} />
    </Suspense>
  );
}

async function Report({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  if (!tracks.includes(track as NormalizedTrack)) notFound();
  const normalized = track as NormalizedTrack;
  const comparison = compareEditions(normalized);
  if (!comparison.ok) notFound();
  return (
    <PageMain>
      <PageHeader
        kicker="2025 / 2026"
        title={`${TRACK_LABEL[normalized].zh}事实对照`}
        lede={`2025 官方名称「${comparison.rawNames[2025]}」，2026 官方名称「${comparison.rawNames[2026]}」。两边都是${comparison.workForm === "series" ? "系列" : "单张"}结构。`}
      />
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-stone-900 text-stone-50">
            <tr>
              <th className="px-3 py-2 font-medium">组别原文</th>
              <th className="px-3 py-2 font-medium">2025</th>
              <th className="px-3 py-2 font-medium">2026</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.categoryId} className="border-t border-border bg-white/70 align-top">
                <td className="px-3 py-3">{row.rawCategory}</td>
                <td className="px-3 py-3">
                  <WorkCell item={row.left} />
                </td>
                <td className="px-3 py-3">
                  <WorkCell item={row.right} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="mt-6 rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
        <InferenceMark />
        <h2 className="mt-3 text-2xl">审美趋势</h2>
        <p className="mt-2 text-sm leading-6">{comparison.inference.reason}</p>
        <p className="mt-2 text-xs text-amber-950">像素趋势：未生成</p>
        <ul className="mt-4 space-y-4">
          {comparison.inference.dimensions.map((dimension) => (
            <li key={dimension.id} className="rounded-xl bg-white/70 px-3 py-3 text-sm">
              <p className="font-medium">{dimension.label}</p>
              <p className="mt-1 text-xs leading-5 text-amber-950">{dimension.status === "text_quoted" ? "说明原句" : "未生成"} · {dimension.reason}</p>
              {dimension.years.map((year) => (
                <div key={year.year} className="mt-2">
                  <p className="text-xs text-stone-500">{year.year}</p>
                  {year.items.length === 0 ? (
                    <p className="text-xs text-stone-500">这一年的说明没有写到这一维。</p>
                  ) : (
                    <ul className="mt-1 space-y-2">
                      {year.items.map((item) => (
                        <li key={`${item.workId}-${item.label}`}>
                          <Link href={item.workId.startsWith("series-") ? `/series/${item.workId}` : `/photographs/${item.workId}`} className="underline">
                            {displayTitle(item.title)}
                          </Link>
                          <span className="ml-2">{item.label}</span>
                          <blockquote className="mt-1 border-l-2 border-amber-900/30 pl-2 text-xs leading-5">{item.quote}</blockquote>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-4 text-sm">
        <FactMark /> <Link href="/reports" className="ml-2 underline">返回报告列表</Link>
      </p>
    </PageMain>
  );
}

function WorkCell({ item }: { item: { href: string; title: string | null; photographers: { name: string }[]; awards: string[] } | null }) {
  if (!item) return <span className="text-stone-500">来源中没有这条冠军记录</span>;
  return (
    <div>
      <Link href={item.href} className="underline-offset-2 hover:underline">
        {displayTitle(item.title)}
      </Link>
      <p className="text-xs text-stone-600">{peopleLine(item.photographers.map((person) => person.name))}</p>
      <p className="text-xs text-stone-500">{item.awards.join(" · ")}</p>
    </div>
  );
}
