import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { dashboardStats, qualityReport } from "@/lib/catalog";
import { collectCompetition } from "@/lib/collection";
import { database } from "@/lib/data/seed";
import { FactMark, InferenceMark, SeedMark } from "@/components/marks";
import { LinearIcon } from "@/components/linear-icon";
import { PageHeader, PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";

const statKeys = [
  ["competitions", "/competitions", "plum"],
  ["editions", "/competitions/swpa", "cobalt"],
  ["works", "/photographs", "ember"],
  ["juries", "/juries", "plum"],
  ["styleTags", "/juries/bindi-vora", "cobalt"],
  ["forms", "/photographs", "ember"],
  ["filled", "/reports/single_image", "plum"],
  ["empty", "/series/series-2025-creative", "cobalt"],
  ["blocked", "/tasks", "ember"],
] as const;

export default function HomePage() {
  const stats = dashboardStats();
  const quality = qualityReport();
  const validation = collectCompetition();
  const values: Record<(typeof statKeys)[number][0], number | string> = {
    competitions: stats.competitions,
    editions: stats.editions,
    works: stats.works,
    juries: stats.juries,
    styleTags: stats.juriesWithStyleTags,
    forms: `${stats.series} / ${stats.singles}`,
    filled: stats.analysesComplete,
    empty: stats.analysesInsufficient,
    blocked: stats.blockedTasks,
  };
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="dashboard.kicker" />} title={<Tr k="dashboard.title" />} lede={<Tr k="dashboard.lede" />} />
      <p className="font-data">
        <Tr k="dashboard.dataLine" />
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <SeedMark />
        <FactMark>
          <Tr k="dashboard.fourSystems" />
        </FactMark>
        <InferenceMark>
          <Tr k="dashboard.evidence" />
        </InferenceMark>
      </div>
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statKeys.map(([key, href, glow]) => (
          <Link key={key} href={href} className={`glass glass-${glow} block p-4`}>
            <p className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <Tr k={`dashboard.${key}`} />
              <LinearIcon icon={ArrowUpRight} />
            </p>
            <p className="font-num stat-value">{values[key]}</p>
          </Link>
        ))}
      </section>
      <section className="glass glass-plum mt-8 p-6">
        <h2 className="text-xl font-medium">
          <Tr k="dashboard.validationTitle" />
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          <Tr
            k="dashboard.validationBody"
            v={{
              agree: validation.summary.agree,
              conflict: validation.summary.conflict,
              single: validation.summary.singleSource,
            }}
          />
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {validation.editions.map((edition) => (
            <Link key={edition.editionId} href={`/editions/${edition.editionId}`} className="underline">
              <Tr k="dashboard.editionConflict" v={{ year: edition.editionYear, count: edition.summary.conflict }} />
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass glass-cobalt p-6">
          <h2 className="text-xl font-medium">
            <Tr k="dashboard.usingTitle" />
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-6">
            {database.editions.map((edition) => (
              <li key={edition.id}>
                <Link className="underline-offset-2 hover:underline" href={`/editions/${edition.id}`}>
                  {edition.officialLabel}
                </Link>
                <span className="ml-2 text-muted-foreground">{edition.submissionNote}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            <Tr k="dashboard.usingNote" />
          </p>
          <Link href="/reports/series" className="mt-4 inline-flex items-center gap-2 text-sm underline">
            <Tr k="dashboard.openReport" />
            <LinearIcon icon={ArrowUpRight} />
          </Link>
        </article>
        <article className="glass glass-ember p-6">
          <h2 className="text-xl font-medium">
            <Tr k="dashboard.qualityTitle" />
          </h2>
          <p className="mt-4 text-xs text-muted-foreground">
            <Tr k={quality.ok ? "dashboard.qualityOk" : "dashboard.qualityBad"} />
            {" · "}
            <Tr k="dashboard.qualityNote" />
          </p>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {quality.checks.slice(0, 6).map((check) => (
              <li key={check.name} className="flex gap-2">
                <span className="font-num text-xs">{check.ok ? "OK" : "--"}</span>
                <span>{check.name}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </PageMain>
  );
}
