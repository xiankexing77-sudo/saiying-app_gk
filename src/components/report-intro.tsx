"use client";

import type { NormalizedTrack } from "@/lib/data/types";
import { translate } from "@/lib/i18n/messages";
import { PageHeader } from "./page-header";
import { useI18n } from "./preferences";

export function ReportIntro({
  track,
  raw2025,
  raw2026,
  series,
}: {
  track: NormalizedTrack;
  raw2025: string;
  raw2026: string;
  series: boolean;
}) {
  const { m } = useI18n();
  return (
    <PageHeader
      kicker="2025 / 2026"
      title={translate(m, "reports.comparison", { name: m.reports[track] })}
      lede={translate(m, "reports.ledeYear", {
        raw2025,
        raw2026,
        form: series ? m.reports.seriesForm : m.reports.singleForm,
      })}
    />
  );
}
