"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteNote,
  deleteScreenshot,
  loadDb,
  saveNote,
  serverSnapshot,
  subscribe,
  toggleFavorite,
} from "@/lib/user-store";
import { MISSING } from "@/lib/types";

export type LibraryTarget = {
  target_type: "work" | "judge";
  target_id: string;
  title: string;
  href: string;
  years: number[];
  categoryId: string | null;
  categoryName: string | null;
};

export function LibraryView({
  targets,
  categories,
}: {
  targets: LibraryTarget[];
  categories: { id: string; name: string }[];
}) {
  const db = useSyncExternalStore(subscribe, loadDb, serverSnapshot);
  const [year, setYear] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const lookup = useMemo(() => {
    const map = new Map<string, LibraryTarget>();
    for (const target of targets) {
      map.set(`${target.target_type}:${target.target_id}`, target);
    }
    return map;
  }, [targets]);

  const favorites = db.favorites.filter((item) => {
    const target = lookup.get(`${item.target_type}:${item.target_id}`);
    if (!target) return false;
    if (year !== "all" && !target.years.map(String).includes(year)) return false;
    if (categoryId !== "all") {
      if (item.target_type !== "work") return false;
      if (target.categoryId !== categoryId) return false;
    }
    return true;
  });

  return (
    <Tabs defaultValue="favorites">
      <TabsList>
        <TabsTrigger value="favorites">收藏</TabsTrigger>
        <TabsTrigger value="notes">笔记</TabsTrigger>
        <TabsTrigger value="shots">截图引用</TabsTrigger>
      </TabsList>
      <TabsContent value="favorites" className="space-y-3 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="h-8 rounded-lg border bg-transparent px-2 text-sm"
            value={year}
            aria-label="按年份筛选收藏"
            onChange={(event) => setYear(event.target.value)}
          >
            <option value="all">全部年份</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
          <select
            className="h-8 rounded-lg border bg-transparent px-2 text-sm"
            value={categoryId}
            aria-label="按题材筛选收藏"
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="all">全部题材</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        {favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            还没有符合筛选的收藏。打开一件作品或一位评委，点「收藏」。
          </p>
        ) : (
          <ul className="space-y-2">
            {favorites.map((item) => {
              const target = lookup.get(`${item.target_type}:${item.target_id}`);
              if (!target) return null;
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                  <div>
                    <Link href={target.href} className="font-medium hover:underline">
                      {target.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.target_type === "work" ? "作品" : "评委"}
                      {target.years.length ? ` · ${target.years.join(" / ")}` : ""}
                      {target.categoryName ? ` · ${target.categoryName}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const result = toggleFavorite(item.target_type, item.target_id);
                      setNotice(
                        result.notesRemain
                          ? "已取消收藏。笔记仍留在「笔记」里。"
                          : "已取消收藏。",
                      );
                    }}
                  >
                    取消收藏
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>
      <TabsContent value="notes" className="space-y-3 pt-4">
        {db.notes.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            还没有笔记。笔记跟作品或评委绑在一起，取消收藏也不会自动删掉。
          </p>
        ) : (
          <ul className="space-y-3">
            {db.notes.map((note) => {
              const target = lookup.get(`${note.target_type}:${note.target_id}`);
              return (
                <NoteRow
                  key={note.id}
                  title={target?.title ?? MISSING}
                  href={target?.href ?? "/me"}
                  body={note.body}
                  onSave={(body) => saveNote(note.target_type, note.target_id, body, note.id)}
                  onDelete={() => deleteNote(note.id)}
                />
              );
            })}
          </ul>
        )}
      </TabsContent>
      <TabsContent value="shots" className="space-y-3 pt-4">
        {db.screenshots.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            还没有截图引用。在作品或评委页保存时，只会记下网址和本地文件名，不会把图片存进赛影。
          </p>
        ) : (
          <ul className="space-y-2">
            {db.screenshots.map((shot) => {
              const target = lookup.get(`${shot.target_type}:${shot.target_id}`);
              return (
                <li key={shot.id} className="rounded-2xl border p-3 text-sm">
                  <p className="font-medium">{target?.title ?? shot.target_id}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    本地：{shot.local_ref}
                  </p>
                  <a
                    href={shot.source_url}
                    className="mt-1 block break-all text-xs underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shot.source_url}
                  </a>
                  <p className="mt-1 text-[11px] text-muted-foreground">{shot.captured_at}</p>
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => deleteScreenshot(shot.id)}
                  >
                    删除引用
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function NoteRow({
  title,
  href,
  body,
  onSave,
  onDelete,
}: {
  title: string;
  href: string;
  body: string;
  onSave: (body: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(body);
  const [editing, setEditing] = useState(false);
  return (
    <li className="rounded-2xl border p-3">
      <Link href={href} className="text-sm font-medium hover:underline">
        {title}
      </Link>
      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea value={value} onChange={(event) => setValue(event.target.value)} />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onSave(value);
              setEditing(false);
            }}
          >
            保存
          </Button>
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{body}</p>
      )}
      <div className="mt-2 flex gap-2">
        <Button type="button" size="xs" variant="outline" onClick={() => setEditing((open) => !open)}>
          {editing ? "收起" : "编辑"}
        </Button>
        <Button type="button" size="xs" variant="ghost" onClick={onDelete}>
          删除
        </Button>
      </div>
    </li>
  );
}
