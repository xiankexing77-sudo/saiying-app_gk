import Link from "next/link";
import { juryAssignments, listJuries } from "@/lib/catalog";
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
        lede="职务、机构和简介摘录是事实。审美偏好需要公开作品样本；目前样本数为 0，画像全部标记为样本不足。匿名评审意味着不能把某件获奖作品说成某位评委的选择。"
      />
      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
        {juries.map((jury) => {
          const assignments = juryAssignments(jury.id);
          return (
            <li key={jury.id} className="px-4 py-4">
              <Link href={`/juries/${jury.id}`} className="text-xl underline-offset-2 hover:underline">
                {jury.name}
              </Link>
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
