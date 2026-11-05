import { AnalyzeStudio } from "@/components/analyze-studio";
import { PageHeader, PageMain } from "@/components/page-header";
import { Tr } from "@/components/preferences";
import { listLibrary } from "@/lib/catalog";

export const metadata = { title: "分析作品" };

export default function AnalyzePage() {
  return (
    <PageMain>
      <PageHeader kicker={<Tr k="analyze.kicker" />} title={<Tr k="analyze.title" />} lede={<Tr k="analyze.lede" />} />
      <AnalyzeStudio references={listLibrary()} />
    </PageMain>
  );
}
