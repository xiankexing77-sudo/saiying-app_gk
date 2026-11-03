"use client";

import { useState } from "react";
import type { LibraryItem } from "@/lib/catalog";
import { displayTitle, peopleLine, trackZh } from "@/lib/labels";
import type { NormalizedTrack } from "@/lib/data/types";
import { FactMark, InferenceMark } from "./marks";

const fields = ["构图", "光线", "色彩", "主体", "叙事", "情绪", "技术表现"];

export function AnalyzeStudio({ references }: { references: LibraryItem[] }) {
  const [fileFact, setFileFact] = useState<{ name: string; type: string; size: number; width: number; height: number } | null>(null);
  const [track, setTrack] = useState<NormalizedTrack>("single_image");
  const [preview, setPreview] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const dimensions = await readDimensions(url);
    setFileFact({
      name: file.name,
      type: file.type || "未知类型",
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    });
  }

  const related = references.filter((item) => item.track === track).slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-teal-900/15 bg-white/70 p-5">
        <FactMark>本地文件事实</FactMark>
        <h2 className="mt-3 text-2xl">你的照片留在浏览器里</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          选择文件后只读取文件名、类型、大小和像素尺寸。二进制不会提交到服务器，也不会进入获奖作品库。
        </p>
        <input
          className="mt-4 block w-full text-sm"
          type="file"
          accept="image/*"
          onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
        />
        {preview ? (
          // User's own local file preview, not a contest image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="本地预览" className="mt-4 max-h-72 w-full rounded-xl object-contain" />
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-stone-300 px-4 py-10 text-sm text-stone-500">尚未选择文件</div>
        )}
        {fileFact ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <FactRow label="文件名" value={fileFact.name} />
            <FactRow label="类型" value={fileFact.type} />
            <FactRow label="大小" value={`${fileFact.size} 字节`} />
            <FactRow label="尺寸" value={`${fileFact.width} × ${fileFact.height}`} />
          </dl>
        ) : null}
      </section>
      <section className="rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
        <InferenceMark />
        <h2 className="mt-3 text-2xl">视觉分析模板</h2>
        <p className="mt-2 text-sm leading-6 text-amber-950">
          未调用视觉模型。下面的维度保持为空，不能根据文件名猜测构图或题材。这也不是比赛结果预测。
        </p>
        <dl className="mt-4 grid gap-2">
          {fields.map((field) => (
            <div key={field} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 text-sm">
              <dt>{field}</dt>
              <dd className="text-stone-500">未分析</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5">
          <p className="text-xs text-amber-950">同赛制获奖目录，只供人工参照，不是相似图检索。</p>
          <select className="mt-2 rounded-lg border bg-white px-2 py-2 text-sm" value={track} onChange={(event) => setTrack(event.target.value as NormalizedTrack)}>
            {(["series", "single_image", "student", "youth"] as const).map((value) => (
              <option key={value} value={value}>
                {trackZh(value)}
              </option>
            ))}
          </select>
          <ul className="mt-3 space-y-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <a className="underline-offset-2 hover:underline" href={item.href}>
                  {item.year} · {item.rawCategory} · {displayTitle(item.title)}
                </a>
                <span className="ml-2 text-xs text-stone-600">{peopleLine(item.photographers.map((person) => person.name))}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2">
      <dt className="text-[11px] text-stone-500">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}

function readDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = url;
  });
}
