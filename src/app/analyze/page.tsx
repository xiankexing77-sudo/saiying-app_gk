import { AnalyzeStudio } from "@/components/analyze-studio";
import { PageHeader, PageMain } from "@/components/page-header";
import { listLibrary } from "@/lib/catalog";

export const metadata = { title: "分析作品" };

export default function AnalyzePage() {
  return (
    <PageMain>
      <PageHeader
        kicker="Upload"
        title="分析自己的照片"
        lede="文件和像素测量留在浏览器里。语义维度只对照你写下的说明，不把这张照片送去和获奖作品做相似检索。"
      />
      <div className="mt-8">
        <AnalyzeStudio references={listLibrary()} />
      </div>
    </PageMain>
  );
}
