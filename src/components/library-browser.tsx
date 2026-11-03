"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LibraryItem } from "@/lib/catalog";
import { displayTitle, peopleLine, trackZh } from "@/lib/labels";
import type { NormalizedTrack } from "@/lib/data/types";
import { FactMark, RightsMark } from "./marks";

const tracks: Array<NormalizedTrack | "all"> = ["all", "series", "single_image", "student", "youth"];

export function LibraryBrowser({ items }: { items: LibraryItem[] }) {
  const [year, setYear] = useState<"all" | "2025" | "2026">("all");
  const [track, setTrack] = useState<(typeof tracks)[number]>("all");
  const [form, setForm] = useState<"all" | "series" | "single">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (year !== "all" && String(item.year) !== year) return false;
      if (track !== "all" && item.track !== track) return false;
      if (form !== "all" && item.form !== form) return false;
      if (!needle) return true;
      const haystack = [item.title, item.rawCategory, ...item.photographers.map((person) => person.name)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [form, items, query, track, year]);

  return (
    <div>
      <div className="grid gap-3 rounded-2xl border border-border bg-white/60 p-4 md:grid-cols-4">
        <label className="text-xs text-stone-600">
          届次
          <select className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm" value={year} onChange={(event) => setYear(event.target.value as typeof year)}>
            <option value="all">全部</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </label>
        <label className="text-xs text-stone-600">
          赛制
          <select className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm" value={track} onChange={(event) => setTrack(event.target.value as typeof track)}>
            {tracks.map((value) => (
              <option key={value} value={value}>
                {value === "all" ? "全部" : trackZh(value)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-stone-600">
          结构
          <select className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm" value={form} onChange={(event) => setForm(event.target.value as typeof form)}>
            <option value="all">全部</option>
            <option value="series">系列</option>
            <option value="single">单张</option>
          </select>
        </label>
        <label className="text-xs text-stone-600">
          检索
          <input
            className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm"
            value={query}
            placeholder="标题或作者"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{visible.length} 条获奖记录。系列画幅不在这张表里重复列出。</p>
      <div className="mt-4 grid gap-3">
        {visible.map((item) => (
          <Link key={item.id} href={item.href} className="rounded-2xl border border-border bg-card p-4 hover:border-stone-500">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
              <FactMark />
              <span>{item.year}</span>
              <span>{item.rawTrack}</span>
              <span>→ {item.normalizedLabel}</span>
              <span>{item.rawCategory}</span>
              <span>{item.form === "series" ? "系列" : "单张"}</span>
              <RightsMark />
            </div>
            <h2 className="mt-2 text-2xl">{displayTitle(item.title)}</h2>
            <p className="mt-1 text-sm">{peopleLine(item.photographers.map((person) => person.name))}</p>
            <p className="mt-2 text-xs text-stone-600">{item.awards.join(" · ") || "奖项未挂接"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
