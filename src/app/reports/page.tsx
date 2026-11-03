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
        lede="对照限于同一规范化赛制。Professional 的 Architecture & Design 不会和 Open 的 Architecture 混在一张表里。审美变化一节保持未生成。"
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
        没有视觉分析结果，报告不写色彩、构图或叙事趋势。
      </p>
    </PageMain>
  );
}
