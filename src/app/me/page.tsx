import { LibraryView, type LibraryTarget } from "@/components/library-view";
import {
  getCategories,
  getCategory,
  getJudgeYears,
  getJudges,
  getWorks,
} from "@/lib/catalog";

export const metadata = { title: "我的" };

export default function MePage() {
  const categories = getCategories();
  const targets: LibraryTarget[] = [
    ...getWorks().map((work) => ({
      target_type: "work" as const,
      target_id: work.id,
      title: work.title,
      href: `/works/${work.id}`,
      years: [work.year],
      categoryId: work.category_id,
      categoryName: getCategory(work.category_id)?.name_zh ?? null,
    })),
    ...getJudges().map((judge) => ({
      target_type: "judge" as const,
      target_id: judge.id,
      title: judge.name,
      href: `/judges/${judge.id}`,
      years: getJudgeYears(judge.id),
      categoryId: null,
      categoryName: null,
    })),
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-serif text-4xl">我的</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        收藏、笔记和截图引用都留在这台浏览器里，不上传到赛影的服务器。
      </p>
      <div className="mt-6">
        <LibraryView
          targets={targets}
          categories={categories.map((category) => ({
            id: category.id,
            name: category.name_zh,
          }))}
        />
      </div>
    </main>
  );
}
