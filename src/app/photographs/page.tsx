import { listLibrary } from "@/lib/catalog";
import { LibraryBrowser } from "@/components/library-browser";
import { PageHeader, PageMain } from "@/components/page-header";

export const metadata = { title: "作品库" };

export default function PhotographsPage() {
  const items = listLibrary();
  return (
    <PageMain>
      <PageHeader
        kicker="Photographs"
        title="获奖作品库"
        lede="系列和单张分开存放。Professional 作品是系列，Open 与 Youth 是单张，Student 按当年命题收录为系列。列表只含各类别冠军和总冠军，不含 Shortlist，也不含第 2、第 3 名——因为来源没有同时给出这些名次的作品标题。"
      />
      <div className="mt-8">
        <LibraryBrowser items={items} />
      </div>
    </PageMain>
  );
}
