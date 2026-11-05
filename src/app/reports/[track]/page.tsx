import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { compareEditions } from "@/lib/catalog";
import type { NormalizedTrack } from "@/lib/data/types";
import { displayTitle, peopleLine } from "@/lib/labels";
import { FactMark, InferenceMark } from "@/components/marks";
import { PageMain } from "@/components/page-header";
import { ReportIntro } from "@/components/report-intro";
import { Tr } from "@/components/preferences";

const tracks: NormalizedTrack[] = ["series", "single_image", "student", "youth"];

export function generateStaticParams() {
  return tracks.map((track) => ({ track }));
}

export default function Page({ params }: { params: Promise<{ track: string }> }) {
  return (
    <Suspense
      fallback={
        <PageMain>
          <Tr k="reports.loading" />
        </PageMain>
      }
    >
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
      <ReportIntro
        track={normalized}
        raw2025={comparison.rawNames[2025]}
        raw2026={comparison.rawNames[2026]}
        series={comparison.workForm === "series"}
      />
      <div className="glass-table">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="font-medium">
                <Tr k="reports.rawCategory" />
              </th>
              <th className="font-num font-medium">2025</th>
              <th className="font-num font-medium">2026</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.categoryId} className="border-t border-border">
                <td>{row.rawCategory}</td>
                <td>
                  <WorkCell item={row.left} />
                </td>
                <td>
                  <WorkCell item={row.right} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="glass glass-ember mt-8 p-6">
        <InferenceMark />
        <h2 className="mt-4 text-xl font-medium">
          <Tr k="reports.trend" />
        </h2>
        <p className="mt-4 text-sm leading-6">{comparison.inference.reason}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Tr k="reports.pixel" />
        </p>
        <ul className="mt-4 flex flex-col gap-4">
          {comparison.inference.dimensions.map((dimension) => (
            <li key={dimension.id} className="rounded-2xl border border-border px-4 py-4 text-sm">
              <p className="font-medium">{dimension.label}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                <Tr k={dimension.status === "text_quoted" ? "reports.quoted" : "reports.notGenerated"} /> · {dimension.reason}
              </p>
              {dimension.years.map((year) => (
                <div key={year.year} className="mt-2">
                  <p className="font-num text-xs text-muted-foreground">{year.year}</p>
                  {year.items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      <Tr k="reports.yearEmpty" />
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-col gap-2">
                      {year.items.map((item) => (
                        <li key={`${item.workId}-${item.label}`}>
                          <Link href={item.workId.startsWith("series-") ? `/series/${item.workId}` : `/photographs/${item.workId}`} className="underline">
                            {displayTitle(item.title)}
                          </Link>
                          <span className="ml-2">{item.label}</span>
                          <blockquote className="mt-2 border-l-2 border-border pl-4 text-xs leading-6">{item.quote}</blockquote>
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
      <p className="mt-4 flex items-center gap-2 text-sm">
        <FactMark />
        <Link href="/reports" className="underline">
          <Tr k="reports.back" />
        </Link>
      </p>
    </PageMain>
  );
}

function WorkCell({
  item,
}: {
  item: { href: string; title: string | null; photographers: { name: string }[]; awards: string[] } | null;
}) {
  if (!item) {
    return (
      <span className="text-muted-foreground">
        <Tr k="reports.missingWinner" />
      </span>
    );
  }
  return (
    <div>
      <Link href={item.href} className="underline-offset-2 hover:underline">
        {displayTitle(item.title)}
      </Link>
      <p className="text-xs text-muted-foreground">{peopleLine(item.photographers.map((person) => person.name))}</p>
      <p className="text-xs text-muted-foreground">{item.awards.join(" · ")}</p>
    </div>
  );
}
