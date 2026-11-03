import Link from "next/link";
import { getJudgesByYear } from "@/lib/catalog";
import { MISSING, type EditionYear } from "@/lib/types";

export const metadata = { title: "评委" };

export default function JudgesPage() {
  const years: EditionYear[] = [2026, 2025];
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-serif text-4xl">评委</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        只列这两届 Photo Awards 的席位。请用简体中文 / 中国区对照官网；英文 Europe 视图可能看不到评委区块。这里没有「曾在其他赛事担任评委」这类栏目。
      </p>
      {years.map((year) => (
        <section key={year} className="mt-8">
          <h2 className="font-serif text-2xl">{year}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {getJudgesByYear(year).map((judge) => (
              <li key={judge.id}>
                <Link
                  href={`/judges/${judge.id}`}
                  className="block h-full rounded-2xl border bg-card p-4 hover:border-primary/40"
                >
                  <h3 className="text-lg">{judge.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{judge.role}</p>
                  <p className="mt-3 text-xs text-amber-950">
                    推断：{judge.style_tags_inferred.join("、")}
                  </p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
                    原文：{judge.bio_official.trim() || MISSING}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
