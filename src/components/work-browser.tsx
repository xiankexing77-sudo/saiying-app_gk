"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MISSING } from "@/lib/types";

export type WorkCardModel = {
  id: string;
  title: string;
  photographer: string | null;
  aliasLine: string;
  categoryId: string;
  categoryName: string;
  awardTypes: string[];
  phone: string | null;
  likeCount: number | null;
  excellent: boolean;
  search: string;
};

const ALL = "all";

export function WorkBrowser({
  works,
  categories,
  awardTypes,
}: {
  works: WorkCardModel[];
  categories: { id: string; name: string }[];
  awardTypes: string[];
}) {
  const [bucket, setBucket] = useState<"award" | "excellent">("award");
  const [categoryId, setCategoryId] = useState(ALL);
  const [awardType, setAwardType] = useState(ALL);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter((work) => {
      if (bucket === "excellent" ? !work.excellent : work.excellent) return false;
      if (categoryId !== ALL && work.categoryId !== categoryId) return false;
      if (awardType !== ALL && !work.awardTypes.includes(awardType)) return false;
      if (q && !work.search.includes(q)) return false;
      return true;
    });
  }, [works, bucket, categoryId, awardType, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={bucket === "award" ? "default" : "outline"}
          onClick={() => setBucket("award")}
        >
          获奖作品
        </Button>
        <Button
          type="button"
          size="sm"
          variant={bucket === "excellent" ? "default" : "outline"}
          onClick={() => setBucket("excellent")}
        >
          优秀作品
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜标题、作者、歪杰、CHUNLIN…"
          aria-label="搜索作品"
        />
        <select
          className="h-8 rounded-lg border bg-transparent px-2 text-sm"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-label="题材"
        >
          <option value={ALL}>全部题材</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="h-8 rounded-lg border bg-transparent px-2 text-sm"
          value={awardType}
          onChange={(event) => setAwardType(event.target.value)}
          aria-label="奖项"
        >
          <option value={ALL}>全部奖项</option>
          {awardTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        {filtered.length} 件
        {bucket === "award" ? "获奖作品" : "优秀作品"}
        。心形数字是点赞，不是评分。
      </p>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-sm leading-6 text-muted-foreground">
          {bucket === "excellent"
            ? "本版没有收录优秀作品。赛影 v1 只整理已经核对过的获奖结果，避免把没核对的名单写进来。"
            : "这个筛选下没有作品。换一个题材或奖项再看。"}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((work) => (
            <li key={work.id}>
              <Link
                href={`/works/${work.id}`}
                className="flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 transition hover:border-primary/40"
              >
                <div className="flex flex-wrap gap-1">
                  {work.awardTypes.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <div>
                  <h2 className="font-serif text-xl leading-snug">{work.title}</h2>
                  <p className="mt-1 text-sm">
                    {work.photographer ?? MISSING}
                    {work.aliasLine ? (
                      <span className="text-muted-foreground"> · {work.aliasLine}</span>
                    ) : null}
                  </p>
                </div>
                <dl className="mt-auto grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>
                    <dt>题材</dt>
                    <dd className="text-foreground">{work.categoryName}</dd>
                  </div>
                  <div>
                    <dt>机型</dt>
                    <dd className="text-foreground">{work.phone ?? MISSING}</dd>
                  </div>
                  <div>
                    <dt>点赞</dt>
                    <dd className="text-foreground">
                      {work.likeCount === null ? MISSING : work.likeCount}
                    </dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
