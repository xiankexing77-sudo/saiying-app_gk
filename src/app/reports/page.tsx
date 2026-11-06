import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TRACK_LABEL } from "@/lib/catalog";
import { InferenceMark } from "@/components/marks";
import { LinearIcon } from "@/components/linear-icon";
import { PageHeader, PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";

export const metadata = { title: "报告" };

const tracks = ["series", "single_image", "student", "youth"] as const;
const glows = ["glass-plum", "glass-cobalt", "glass-ember", "glass-plum"] as const;

export default function ReportsPage() {
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="reports.kicker" />} title={<Tr k="reports.title" />} lede={<Tr k="reports.lede" />} />
      <div className="grid gap-4 sm:grid-cols-2">
        {tracks.map((track, index) => (
          <Link key={track} href={`/reports/${track}`} className={`glass ${glows[index]} block p-6`}>
            <p className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{TRACK_LABEL[track].rawExample}</span>
              <LinearIcon icon={ArrowUpRight} />
            </p>
            <h2 className="mt-4 text-xl font-medium">
              <Tr k={`reports.${track}`} />
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <Tr k="reports.normalized" v={{ name: TRACK_LABEL[track].normalized }} />
            </p>
          </Link>
        ))}
      </div>
      <Link href="/reports/stage-b" className="glass glass-cobalt mt-4 block p-6">
        <p className="text-xs text-muted-foreground">Cut 2026-11-05-B · policy C</p>
        <h2 className="mt-4 text-xl font-medium">
          <Tr k="reports.stageCard" />
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          <Tr k="reports.stageCardBody" />
        </p>
      </Link>
      <p className="mt-8 flex items-center gap-2 text-sm">
        <InferenceMark />
        <Tr k="reports.note" />
      </p>
    </PageMain>
  );
}
