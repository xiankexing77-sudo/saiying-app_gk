import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { juryAssignments, listJuries, personalWorks } from "@/lib/catalog";
import { trackZh } from "@/lib/labels";
import { LinearIcon } from "@/components/linear-icon";
import { PageHeader, PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";

export const metadata = { title: "评委" };

export default function JuriesPage() {
  const juries = listJuries();
  const glows = ["glass-plum", "glass-cobalt", "glass-ember"] as const;
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="juries.kicker" />} title={<Tr k="juries.title" />} lede={<Tr k="juries.lede" />} />
      <ul className="flex flex-col gap-4">
        {juries.map((jury, index) => {
          const assignments = juryAssignments(jury.id);
          const works = personalWorks(jury.id);
          const count = works?.groups.length ?? 0;
          const enough = count >= 3;
          return (
            <li key={jury.id} className={`glass ${glows[index % glows.length]} p-6`}>
              <Link href={`/juries/${jury.id}`} className="inline-flex items-center gap-2 text-xl font-medium underline-offset-2 hover:underline">
                {jury.name}
                <LinearIcon icon={ArrowUpRight} />
              </Link>
              <p className="mt-2 text-sm">
                <span className="font-num">
                  <Tr k="juries.sample" v={{ count }} />
                </span>
                {" · "}
                <Tr k={enough ? "juries.enough" : "juries.short"} />
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
                {assignments.map((assignment) => (
                  <li key={assignment.id}>
                    <span className="font-num">{assignment.editionId.replace("swpa-", "")}</span>
                    {" · "}
                    {assignment.tracks.map((track) => trackZh(track)).join("、")} · {assignment.roleTitle}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </PageMain>
  );
}
