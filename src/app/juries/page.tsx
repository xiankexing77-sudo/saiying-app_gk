import Link from "next/link";
import { juryAssignments, listJuries, personalWorks } from "@/lib/catalog";
import { trackZh } from "@/lib/labels";
import { PageHeader, PageMain } from "@/components/page-header";

export const metadata = { title: "评委" };

export default function JuriesPage() {
  const juries = listJuries();
  return (
    <PageMain>
      <PageHeader
        kicker="Juries"
        title="评委数据库"
        lede="职务和简介是事实。风格标签要先有至少 3 组本人作品；同一套作品多处发表只算 1 组。不足 3 组标为样本不足，不从简介臆测偏好，也不把获奖作品算成评委自己的选择。"
      />
      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {juries.map((jury) => {
          const assignments = juryAssignments(jury.id);
          const works = personalWorks(jury.id);
          const count = works?.groups.length ?? 0;
          const enough = count >= 3;
          return (
            <li key={jury.id} className="px-4 py-4">
              <Link href={`/juries/${jury.id}`} className="text-xl underline-offset-2 hover:underline">
                {jury.name}
              </Link>
              <p className={`mt-1 text-sm ${enough ? "text-teal-900" : "text-amber-900"}`}>
                本人作品 {count}/3 组 · {enough ? "已生成风格标签" : "样本不足"}
              </p>
              <ul className="mt-2 space-y-1 text-sm text-stone-600">
                {assignments.map((assignment) => (
                  <li key={assignment.id}>
                    {assignment.editionId.replace("swpa-", "")} · {assignment.tracks.map((track) => trackZh(track)).join("、")} · {assignment.roleTitle}
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
