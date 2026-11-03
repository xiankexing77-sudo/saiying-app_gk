"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addScreenshot,
  deleteNote,
  isFavorite,
  loadDb,
  notesFor,
  saveNote,
  serverSnapshot,
  subscribe,
  toggleFavorite,
} from "@/lib/user-store";
import type { Note } from "@/lib/types";

function useDb() {
  return useSyncExternalStore(subscribe, loadDb, serverSnapshot);
}

export function UserPanel({
  targetType,
  targetId,
  sourceUrl,
}: {
  targetType: "work" | "judge";
  targetId: string;
  sourceUrl: string;
}) {
  const db = useDb();
  const saved = isFavorite(db, targetType, targetId);
  const notes = notesFor(db, targetType, targetId);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Note | null>(null);

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={saved ? "secondary" : "default"}
          onClick={() => {
            const result = toggleFavorite(targetType, targetId);
            if (!result.favorited && result.notesRemain) {
              setMessage("已取消收藏。笔记仍留在「我的」，没有一起删掉。");
            } else if (result.favorited) {
              setMessage("已收入收藏。");
            } else {
              setMessage("已取消收藏。");
            }
          }}
        >
          {saved ? "已收藏" : "收藏"}
        </Button>
        <ScreenshotDialog targetType={targetType} targetId={targetId} sourceUrl={sourceUrl} />
      </div>
      {message ? (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {message}
        </p>
      ) : null}

      <div className="space-y-2">
        <h2 className="text-sm font-medium">私人笔记</h2>
        <p className="text-xs text-muted-foreground">
          写给自己的练习计划或构图观察。只存在这台浏览器里。
        </p>
        <Textarea
          value={editing ? editing.body : draft}
          onChange={(event) => {
            if (editing) setEditing({ ...editing, body: event.target.value });
            else setDraft(event.target.value);
          }}
          placeholder="例如：下次拍夜景，先把亮的灯放在角落。"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (editing) {
                saveNote(targetType, targetId, editing.body, editing.id);
                setEditing(null);
              } else {
                saveNote(targetType, targetId, draft);
                setDraft("");
              }
            }}
          >
            {editing ? "更新笔记" : "写下笔记"}
          </Button>
          {editing ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>
              取消编辑
            </Button>
          ) : null}
        </div>
        <ul className="space-y-2">
          {notes.length === 0 ? (
            <li className="text-sm text-muted-foreground">还没有笔记。</li>
          ) : (
            notes.map((note) => (
              <li key={note.id} className="rounded-xl bg-muted/60 p-3 text-sm">
                <p className="whitespace-pre-wrap leading-6">{note.body}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" size="xs" variant="outline" onClick={() => setEditing(note)}>
                    编辑
                  </Button>
                  <Button type="button" size="xs" variant="ghost" onClick={() => deleteNote(note.id)}>
                    删除
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

function ScreenshotDialog({
  targetType,
  targetId,
  sourceUrl,
}: {
  targetType: "work" | "judge";
  targetId: string;
  sourceUrl: string;
}) {
  const [localRef, setLocalRef] = useState("");
  const [url, setUrl] = useState(sourceUrl);
  const [saved, setSaved] = useState(false);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>保存截图引用</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>截图引用</DialogTitle>
          <DialogDescription>
            只记录来源网址、时间和你本机的文件名或路径。赛影不会上传、也不会保存图片本身。
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!url.trim() || !localRef.trim()) return;
            addScreenshot({
              target_type: targetType,
              target_id: targetId,
              source_url: url,
              local_ref: localRef,
            });
            setSaved(true);
            setLocalRef("");
          }}
        >
          <label className="block space-y-1 text-xs">
            来源网址
            <Input value={url} onChange={(event) => setUrl(event.target.value)} required />
          </label>
          <label className="block space-y-1 text-xs">
            本地文件名或路径
            <Input
              value={localRef}
              onChange={(event) => setLocalRef(event.target.value)}
              placeholder="例如 Desktop/地球之巅-笔记.png"
              required
            />
          </label>
          <label className="block space-y-1 text-xs text-muted-foreground">
            也可以选一个本机文件，这里只取文件名
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setLocalRef(file.name);
              }}
            />
          </label>
          <Button type="submit" className="w-full">
            记下这条引用
          </Button>
          {saved ? <p className="text-xs text-muted-foreground">已写入「我的 / 截图引用」。</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  );
}
