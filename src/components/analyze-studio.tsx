"use client";

import { useState } from "react";
import type { LibraryItem } from "@/lib/catalog";
import { aspectLabel, measureSamples, orientationOf, type SampleMeasurement } from "@/lib/measure";
import { displayTitle, peopleLine, trackZh } from "@/lib/labels";
import type { NormalizedTrack, SingleImageAnalysis } from "@/lib/data/types";
import { FactMark, InferenceMark } from "./marks";

const semanticFields = ["主体", "叙事", "主题", "情绪", "构图判断", "比赛匹配"];

export function AnalyzeStudio({ references }: { references: LibraryItem[] }) {
  const [fileFact, setFileFact] = useState<{ name: string; type: string; size: number; width: number; height: number } | null>(null);
  const [measurement, setMeasurement] = useState<SampleMeasurement | null>(null);
  const [track, setTrack] = useState<NormalizedTrack>("single_image");
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [captionAnalysis, setCaptionAnalysis] = useState<SingleImageAnalysis | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    const url = URL.createObjectURL(file);
    setPreview(url);
    setCaptionAnalysis(null);
    setMessage(null);
    const image = await loadImage(url);
    setFileFact({
      name: file.name,
      type: file.type || "未知类型",
      size: file.size,
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
    });
    setMeasurement(image ? sampleImage(image) : null);
  }

  async function analyzeCaption() {
    setPending(true);
    try {
      const response = await fetch("/api/v1/uploads/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const body = (await response.json()) as { message?: string; analysis?: SingleImageAnalysis };
      setMessage(body.message ?? "已返回");
      setCaptionAnalysis(body.analysis ?? null);
    } catch {
      setMessage("请求没有完成");
    } finally {
      setPending(false);
    }
  }

  const related = references.filter((item) => item.track === track).slice(0, 6);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-teal-900/15 bg-white/70 p-5">
        <FactMark>本地文件事实</FactMark>
        <h2 className="mt-3 text-2xl">你的照片留在浏览器里</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          选择文件后只在本地读取文件名、类型、大小、尺寸，并用缩小后的像素样本计算亮度与颜色。二进制不会提交到服务器，也不会进入获奖作品库。
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
            <FactRow label="宽高比" value={aspectLabel(fileFact.width, fileFact.height)} />
            <FactRow label="画幅" value={orientationOf(fileFact.width, fileFact.height)} />
          </dl>
        ) : null}
        {measurement ? (
          <div className="mt-4">
            <FactMark>本地测量</FactMark>
            <p className="mt-2 text-xs leading-5 text-stone-600">{measurement.method} 这不是主体识别，也不是赛事匹配。</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <FactRow label="样本数" value={String(measurement.sampleCount)} />
              <FactRow label="平均亮度" value={measurement.meanLuminance === null ? "—" : String(measurement.meanLuminance)} />
              <FactRow label="暗部占比" value={share(measurement.shadowShare)} />
              <FactRow label="高光占比" value={share(measurement.highlightShare)} />
              <FactRow label="平均饱和度" value={measurement.meanSaturation === null ? "—" : String(measurement.meanSaturation)} />
              <FactRow label="暖冷差（R−B）" value={measurement.warmCool === null ? "—" : String(measurement.warmCool)} />
              <FactRow label="占优色相" value={measurement.dominantHue ?? "不命名"} />
            </dl>
          </div>
        ) : null}
      </section>
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-900/25 bg-amber-50/80 p-5">
          <InferenceMark />
          <h2 className="mt-3 text-2xl">说明证据</h2>
          <p className="mt-2 text-sm leading-6 text-amber-950">
            本地测量不判断主体、叙事或主题。如果你写下这张照片在拍什么，服务器只对这段文字做词表对照，不接收图像。
          </p>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="例如：a black-and-white portrait in a bedroom"
            className="mt-3 min-h-24 w-full rounded-xl border border-amber-900/20 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending || caption.trim().length === 0}
            onClick={() => void analyzeCaption()}
            className="mt-3 rounded-full bg-amber-900 px-4 py-2 text-sm text-amber-50 disabled:opacity-60"
          >
            {pending ? "对照中" : "对照这段说明"}
          </button>
          {message ? <p className="mt-3 text-xs leading-5 text-amber-950">{message}</p> : null}
          {captionAnalysis ? (
            <dl className="mt-4 grid gap-2">
              {(
                [
                  ["主体与场景", captionAnalysis.subjectScene],
                  ["构图", captionAnalysis.composition],
                  ["光线", captionAnalysis.light],
                  ["色彩", captionAnalysis.color],
                  ["叙事", captionAnalysis.narrative],
                  ["主题", captionAnalysis.theme],
                  ["情绪", captionAnalysis.mood],
                  ["技术表现", captionAnalysis.technique],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white/70 px-3 py-2 text-sm">
                  <dt className="text-[11px] text-amber-900/80">{label}</dt>
                  <dd>{value ?? <span className="text-stone-500">未分析</span>}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              {semanticFields.map((field) => (
                <li key={field} className="flex justify-between rounded-xl bg-white/70 px-3 py-2">
                  <span>{field}</span>
                  <span>未分析</span>
                </li>
              ))}
            </ul>
          )}
          {captionAnalysis?.evidence.map((item) => (
            <blockquote key={`${item.dimension}-${item.label}`} className="mt-2 border-l-2 border-amber-900/30 pl-2 text-xs leading-5">
              {item.quote}
            </blockquote>
          ))}
        </div>
        <div className="rounded-2xl border border-border bg-white/70 p-5">
          <p className="text-xs text-stone-600">同赛制获奖目录，只供人工参照，不是相似图检索，也不是比赛预测。</p>
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

function share(value: number | null) {
  if (value === null) return "—";
  return `${Math.round(value * 1000) / 10}%`;
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2">
      <dt className="text-[11px] text-stone-500">{label}</dt>
      <dd className="break-all">{value}</dd>
    </div>
  );
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function sampleImage(image: HTMLImageElement): SampleMeasurement | null {
  const maxEdge = 64;
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (longest <= 0) return null;
  const scale = Math.min(1, maxEdge / longest);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  const samples = [];
  for (let index = 0; index < data.length; index += 16) {
    samples.push({ r: data[index] ?? 0, g: data[index + 1] ?? 0, b: data[index + 2] ?? 0 });
  }
  return measureSamples(samples);
}
