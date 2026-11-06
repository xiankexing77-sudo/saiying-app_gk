import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FactMark, InferenceMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";
import { PersonalWorksPanel } from "@/components/personal-works-panel";
import { ProvenanceLine } from "@/components/provenance";
import { JuryConfidence, RequestAnalysis } from "@/components/request-analysis";
import { JuryValidation } from "@/components/validation-panel";
import { JuryGraph } from "@/components/jury-graph";
import { Tr } from "@/components/preferences";
import { getJury, juryAssignments, juryProfile, listJuries, quotesBySpeaker } from "@/lib/catalog";
import { juryResearchGraph } from "@/lib/jury-graph";
import { trackZh } from "@/lib/labels";

export function generateStaticParams() {
  return listJuries().map((jury) => ({ id: jury.id }));
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <PageMain>
          <Tr k="juries.opening" />
        </PageMain>
      }
    >
      <JuryPage params={params} />
    </Suspense>
  );
}

async function JuryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jury = getJury(id);
  if (!jury) notFound();
  const assignments = juryAssignments(jury.id);
  const profile = juryProfile(jury.id);
  const quotes = quotesBySpeaker(jury.name);
  const inference = profile.inference;
  const graph = juryResearchGraph(jury.id);
  const fields = [
    ["juries.visual", inference?.visualStyle],
    ["juries.subjects", inference?.commonSubjects],
    ["juries.color", inference?.colorTendency],
    ["juries.composition", inference?.compositionTendency],
    ["juries.narrative", inference?.narrativePreference],
    ["juries.thematic", inference?.thematicMode],
  ] as const;
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="juries.detailKicker" />} title={jury.name} lede={<Tr k="juries.detailLede" />} />
      {profile.personalWorks ? <PersonalWorksPanel works={profile.personalWorks} inference={inference} /> : null}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section className="glass glass-cobalt p-6">
          <FactMark>
            <Tr k="juries.factTitle" />
          </FactMark>
          <h2 className="mt-4 text-xl font-medium">
            <Tr k="juries.publicIdentity" />
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="border-t border-border pt-4">
                <Link href={`/editions/${assignment.editionId}`} className="text-sm underline">
                  <Tr k="juries.edition" v={{ year: assignment.editionId.replace("swpa-", "") }} />
                </Link>
                <p className="mt-2 text-sm">{assignment.roleTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {assignment.institution ?? <Tr k="juries.institutionMissing" />} · {assignment.tracks.map((track) => trackZh(track)).join("、")}
                </p>
                {assignment.biographyExcerpt ? (
                  <p className="mt-2 text-sm leading-6">{assignment.biographyExcerpt}</p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <Tr k="juries.noBio" />
                  </p>
                )}
                <p className="mt-2 text-xs">
                  <a className="underline" href={assignment.officialProfileUrl}>
                    <Tr k="juries.official" />
                  </a>
                </p>
                <ProvenanceLine provenance={assignment.provenance} />
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-lg font-medium">
            <Tr k="juries.missingTitle" />
          </h3>
          <ul className="mt-2 text-sm text-muted-foreground">
            <li>
              <Tr k="juries.education" />：{profile.facts?.education ?? <Tr k="juries.notGiven" />}
            </li>
            <li>
              <Tr k="juries.publications" />：{profile.facts?.publications.length ? profile.facts.publications.join("、") : <Tr k="juries.notCollected" />}
            </li>
            <li>
              <Tr k="juries.interviews" />：{profile.facts?.interviews.length ? <Tr k="juries.hasInterview" /> : <Tr k="juries.notCollected" />}
            </li>
            <li>
              <Tr k="juries.personal" />：
              {profile.personalWorks ? <Tr k="juries.groups" v={{ count: profile.personalWorks.groups.length }} /> : <Tr k="juries.notCollected" />}。
              {profile.portfolios[0]?.note}
            </li>
          </ul>
          {quotes.map(({ quote, series }) => (
            <article key={series.id} className="mt-4 rounded-2xl border border-border p-4">
              <FactMark>
                <Tr k="juries.quote" />
              </FactMark>
              <p className="mt-2 text-sm leading-6">{quote.text}</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">{quote.boundary}</p>
              <Link className="text-xs underline" href={`/series/${series.id}`}>
                <Tr k="juries.related" />：{series.title}
              </Link>
            </article>
          ))}
        </section>
        <section className="glass glass-ember p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <InferenceMark />
              <h2 className="text-xl font-medium">
                <Tr k="juries.profile" />
              </h2>
            </div>
            <RequestAnalysis url={`/api/v1/juries/${jury.id}/analyze`} />
          </div>
          {inference?.sampleStatus === "insufficient" ? (
            <p className="mt-4 rounded-2xl border border-border px-4 py-2 text-sm">
              <Tr k="juries.insufficient" v={{ count: inference.sampleCount, need: inference.requiredGroupCount }} />
            </p>
          ) : (
            <p className="mt-4 rounded-2xl border border-border px-4 py-2 text-sm">
              <Tr k="juries.sufficient" v={{ need: inference?.requiredGroupCount ?? 3 }} />
            </p>
          )}
          <p className="mt-4 text-sm leading-6">{inference?.statement}</p>
          <dl className="mt-4 grid gap-2 text-sm">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 rounded-lg border border-border px-4 py-2">
                <dt>
                  <Tr k={label} />
                </dt>
                <dd className="max-w-[16rem] text-right text-muted-foreground">
                  {value ?? (inference?.sampleStatus === "sufficient" ? <Tr k="juries.notEnoughEvidence" /> : <Tr k="juries.notAnalyzed" />)}
                </dd>
              </div>
            ))}
          </dl>
          <JuryConfidence
            confidence={String(inference?.confidence ?? "—")}
            model={inference?.modelName ?? null}
            count={inference?.evidence.length ?? 0}
          />
        </section>
      </div>
      {graph ? <JuryGraph graph={graph} /> : null}
      <JuryValidation juryId={jury.id} />
      <p className="mt-4 text-sm">
        <Link href="/juries" className="underline">
          <Tr k="juries.back" />
        </Link>
      </p>
    </PageMain>
  );
}
