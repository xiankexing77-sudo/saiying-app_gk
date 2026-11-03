import Link from "next/link";
import { getContest, getStats, getWorksByYear } from "@/lib/catalog";

export default function HomePage() {
  const years = [2026, 2025] as const;
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
      <p className="text-xs tracking-[0.22em] text-primary">VISION+ MOBILE PHOTOAWARDS</p>
      <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
        一张获奖作，为什么可能入选
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
        赛影把 vivo VISION+ 手机摄影大赛 2025 与 2026 已经公开的获奖结果、评委页简介整理成可以慢慢读的档案。风格和入选原因是学习向推断，不是官网评语，也不是分数。
      </p>
      <p className="mt-4 max-w-2xl rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        作品集上的心是点赞，不是评分。英文 Europe 视图里，评委区块可能根本不出现。
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {years.map((year) => {
          const contest = getContest(year);
          const stats = getStats(year);
          const best = getWorksByYear(year).find((work) =>
            work.title === (year === 2026 ? "地球之巅" : "太空战舰"),
          );
          return (
            <Link
              key={year}
              href={`/contests/${year}`}
              className="rounded-3xl border bg-card p-6 transition hover:border-primary/40"
            >
              <p className="text-sm text-muted-foreground">{contest?.name}</p>
              <h2 className="mt-1 font-serif text-4xl">{year}</h2>
              <p className="mt-3 text-sm leading-6">{contest?.status_note}</p>
              <p className="mt-4 text-sm">
                获奖 {stats.workCount} 件
                {best ? ` · 年度最佳《${best.title}》` : ""}
              </p>
              <p className="mt-6 text-sm text-primary">打开这一届</p>
            </Link>
          );
        })}
      </div>
      <section className="mt-10 grid gap-6 border-t pt-8 md:grid-cols-3">
        <div>
          <h2 className="text-sm font-medium">怎么用</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-muted-foreground">
            <li>选 2026 或 2025</li>
            <li>打开一件获奖作品</li>
            <li>读入选解读，再决定要不要练</li>
          </ol>
        </div>
        <div>
          <h2 className="text-sm font-medium">评委</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            2026 五人，2025 五人（含 Alex Webb）。简介只取中文区 Photo Awards 页上能核对到的文字。
          </p>
          <Link href="/judges" className="mt-2 inline-block text-sm text-primary">
            去评委库
          </Link>
        </div>
        <div>
          <h2 className="text-sm font-medium">官网还有别的栏目</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            VISION+ 站点还包括 Film 和 Exhibitions。赛影没有收录那些全库，只做 Mobile PhotoAwards 的 2025 与 2026。
          </p>
        </div>
      </section>
    </main>
  );
}
