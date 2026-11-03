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
        lede="文件事实和推断模板分栏显示。平台不保存这张照片，也不把它和获奖作品做向量相似检索。"
      />
      <div className="mt-8">
        <AnalyzeStudio references={listLibrary()} />
      </div>
    </PageMain>
  );
}
