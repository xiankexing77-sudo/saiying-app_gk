import Link from "next/link";
import { connection } from "next/server";
import { FactMark, InferenceMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";
import { StageBRun } from "@/components/stage-b-run";
import { Tr } from "@/components/preferences";
import { displayTitle } from "@/lib/labels";
import { buildStageBReport } from "@/lib/stage-b/report";

export const metadata = { title: "阶段 B 研究草稿" };

export default async function Page() {
  await connection();
  const report = buildStageBReport();
  return (
    <PageMain>
      <PageHeader
        kicker={<Tr k="stageB.kicker" />}
        title={<Tr k="stageB.title" />}
        lede={<Tr k="stageB.lede" />}
        actions={<StageBRun />}
      />
      <p className="text-sm leading-6">
        <Tr k="stageB.policy" v={{ policy: report.policy.policy, at: report.policy.confirmedAt }} />
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        <Tr k="stageB.liveNote" />
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-medium">
          <FactMark /> <Tr k="stageB.winners" />
        </h2>
        <div className="glass-table mt-4">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr>
                <th className="font-medium"><Tr k="stageB.year" /></th>
                <th className="font-medium"><Tr k="stageB.fixture" /></th>
                <th className="font-medium"><Tr k="stageB.name" /></th>
                <th className="font-medium"><Tr k="stageB.author" /></th>
                <th className="font-medium"><Tr k="stageB.award" /></th>
                <th className="font-medium"><Tr k="stageB.category" /></th>
                <th className="font-medium"><Tr k="stageB.source" /></th>
              </tr>
            </thead>
            <tbody>
              {report.winners.map((winner) => (
                <tr key={winner.fixtureId} className="border-t border-border">
                  <td className="font-num">{winner.editionYear}</td>
                  <td className="font-num text-xs">{winner.fixtureId}</td>
                  <td>{displayTitle(winner.name)}</td>
                  <td>{winner.authors.map((author) => author.name).join("、")}</td>
                  <td>{winner.awards.join(" · ")}</td>
                  <td>{winner.category}</td>
                  <td>
                    <a className="underline" href={winner.sourceUrl}>
                      {winner.sourcePageTitle}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {winner.imageExport ? winner.imageExport.sourceUrl : <Tr k="stageB.noImage" />}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">
          <FactMark /> <Tr k="stageB.juries" />
        </h2>
        <div className="mt-4 grid gap-4">
          {report.juries.map((jury) => {
            const role = jury.fields.find((field) => field.key === "roleTitle");
            const institution = jury.fields.find((field) => field.key === "institution");
            const biography = jury.fields.find((field) => field.key === "biographyExcerpt");
            return (
              <article key={`${jury.juryId}-${jury.editionYear}`} className="glass glass-cobalt p-4 text-sm">
                <p className="font-medium">
                  {jury.name} <span className="font-num text-xs text-muted-foreground">{jury.editionYear}</span>
                </p>
                <p className="mt-2">{role?.quote ?? <Tr k="stageB.uncollected" />}</p>
                <p className="mt-1 text-xs text-muted-foreground">{institution?.quote ?? ""}</p>
                {biography ? <blockquote className="mt-2 border-l-2 border-border pl-4 text-xs leading-6">{biography.quote}</blockquote> : <p className="mt-2 text-xs text-muted-foreground"><Tr k="stageB.biography" />：<Tr k="stageB.uncollected" /></p>}
                <p className="mt-2 text-xs text-muted-foreground">
                  <Tr k="stageB.education" />：<Tr k="stageB.uncollected" /> · <Tr k="stageB.round" />：<Tr k="stageB.roundEmpty" />
                </p>
                <a className="mt-2 inline-block text-xs underline" href={jury.sourceUrl}>
                  {jury.sourceUrl}
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-medium">
          <FactMark /> <Tr k="stageB.audits" />
        </h2>
        {report.cache.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            <Tr k="stageB.noCache" />
          </p>
        ) : (
          <ul className="glass mt-4 divide-y divide-border text-sm">
            {report.cache.map((item) => (
              <li key={item.workId} className="px-4 py-4">
                <p className="font-num text-xs">{item.workId}</p>
                <a className="mt-2 block break-all underline" href={item.sourceUrl}>
                  {item.sourceUrl}
                </a>
                <p className="font-num mt-2 text-xs">
                  <Tr k="stageB.downloadedAt" /> {item.downloadedAt}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <Tr k="stageB.storagePath" /> {item.relativePath}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="glass p-4">
          <h2 className="text-xl font-medium">
            <FactMark /> <Tr k="stageB.facts" />
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {report.columns.fact.map((item) =>
              item.kind === "fact" ? (
                <li key={item.id} className="border-t border-border pt-4 text-sm">
                  <p>{item.text}</p>
                  <blockquote className="mt-2 border-l-2 border-border pl-4 text-xs leading-6">{item.evidence.quote}</blockquote>
                  <a className="mt-2 block text-xs underline" href={item.evidence.sourceUrl}>
                    {item.evidence.sourceUrl}
                  </a>
                  {item.evidence.downloadedAt ? <p className="font-num mt-1 text-xs text-muted-foreground">{item.evidence.downloadedAt}</p> : null}
                </li>
              ) : null,
            )}
          </ul>
        </div>
        <div className="glass glass-ember p-4">
          <h2 className="text-xl font-medium">
            <InferenceMark><Tr k="stageB.hypotheses" /></InferenceMark>
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {report.columns.hypothesis.map((item) =>
              item.kind === "hypothesis" ? (
                <li key={item.id} className="border-t border-border pt-4 text-sm">
                  <p>{item.text}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.groundedIn.join(" · ")}</p>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </section>
      <p className="mt-8 text-sm">
        <Link href="/reports" className="underline">
          <Tr k="stageB.back" />
        </Link>
      </p>
    </PageMain>
  );
}
