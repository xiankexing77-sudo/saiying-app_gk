import Link from "next/link";
import { dashboardStats, qualityReport } from "@/lib/catalog";
import { database } from "@/lib/data/seed";
import { FactMark, InferenceMark, SeedMark } from "@/components/marks";
import { PageHeader, PageMain } from "@/components/page-header";

export default function HomePage() {
  const stats = dashboardStats();
  const quality = qualityReport();
  return (
    <PageMain>
      <PageHeader
        kicker="SWPA pilot"
        title="摄影赛事评委研究"
        lede="Photo Jury Intelligence 收录 Sony World Photography Awards 2025 与 2026 的公开获奖记录和评委资料。官方事实带有来源；视觉分析和评委审美偏好是单独的推断层，当前没有执行。"
      />
      <div className="mt-6 flex flex-wrap gap-2">
        <SeedMark />
        <FactMark>四个比赛体系</FactMark>
        <InferenceMark>模板 · 未调用模型</InferenceMark>
      </div>
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="赛事" value={stats.competitions} href="/competitions" />
        <Stat label="届次" value={stats.editions} href="/competitions/swpa" />
        <Stat label="获奖记录" value={stats.works} href="/photographs" />
        <Stat label="评委" value={stats.juries} href="/juries" />
        <Stat label="系列 / 单张" value={`${stats.series} / ${stats.singles}`} href="/photographs" />
        <Stat label="已完成视觉分析" value={stats.analysesComplete} href="/reports" />
        <Stat label="分析模板" value={stats.analysesTemplate} href="/analyze" />
        <Stat label="阻塞任务" value={stats.blockedTasks} href="/tasks" />
      </section>
      <section className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-2xl">正在使用的数据</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            {database.editions.map((edition) => (
              <li key={edition.id}>
                <Link className="underline-offset-2 hover:underline" href={`/editions/${edition.id}`}>
                  {edition.officialLabel}
                </Link>
                <span className="ml-2 text-stone-500">{edition.submissionNote}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            2025 与 2026 获奖画廊仍使用 Professional competition 与 Open competition。平台另存规范化名称 Series 与 Single Image，方便以后对齐更名后的赛制，不覆盖原文。
          </p>
          <Link href="/reports/series" className="mt-4 inline-block text-sm underline">
            打开 2025 / 2026 系列赛事实对照
          </Link>
        </article>
        <article className="rounded-2xl border border-border bg-white/60 p-5">
          <h2 className="text-2xl">完整性检查</h2>
          <p className="mt-2 text-xs text-stone-500">{quality.ok ? "全部通过" : "有未通过项"} · 这是对种子的规则检查，不是 AI 结论</p>
          <ul className="mt-3 space-y-2 text-sm">
            {quality.checks.slice(0, 6).map((check) => (
              <li key={check.name} className="flex gap-2">
                <span className="text-teal-900">{check.ok ? "通过" : "未过"}</span>
                <span>{check.name}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </PageMain>
  );
}

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card px-4 py-4 hover:border-stone-500">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </Link>
  );
}
