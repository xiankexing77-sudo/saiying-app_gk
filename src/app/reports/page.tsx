import Link from "next/link";
import { TRACK_LABEL } from "@/lib/catalog";
import { PageHeader, PageMain } from "@/components/page-header";
import { InferenceMark } from "@/components/marks";

export const metadata = { title: "报告" };

const tracks = ["series", "single_image", "student", "youth"] as const;

export default function ReportsPage() {
  return (
    <PageMain>
      <PageHeader
        kicker="Reports"
        title="研究报告"
        lede="对照限于同一规范化赛制。Professional 的 Architecture & Design 不会和 Open 的 Architecture 混在一张表里。像素上的审美变化不生成；只有官方说明原句写到的维度才会按年列出。"
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {tracks.map((track) => (
          <Link key={track} href={`/reports/${track}`} className="rounded-2xl border border-border bg-card p-5 hover:border-stone-500">
            <p className="text-xs text-stone-500">{TRACK_LABEL[track].rawExample}</p>
            <h2 className="mt-2 text-2xl">{TRACK_LABEL[track].zh}</h2>
            <p className="mt-2 text-sm text-stone-600">规范化名称 {TRACK_LABEL[track].normalized}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm">
        <InferenceMark />
        没有像素分析。说明里没写到的色彩、构图或叙事保持未生成。
      </p>
    </PageMain>
  );
}
