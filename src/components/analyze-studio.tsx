"use client";

import { useState } from "react";
import { ScanLine } from "lucide-react";
import type { LibraryItem } from "@/lib/catalog";
import { aspectLabel, measureSamples, orientationOf, type SampleMeasurement } from "@/lib/measure";
import { displayTitle, peopleLine } from "@/lib/labels";
import type { NormalizedTrack, SingleImageAnalysis } from "@/lib/data/types";
import { translate } from "@/lib/i18n/messages";
import { FactMark, InferenceMark } from "./marks";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";

export function AnalyzeStudio({ references }: { references: LibraryItem[] }) {
  const { m } = useI18n();
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
      type: file.type || m.analyze.unknownType,
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
      setMessage(body.message ?? m.analyze.returned);
      setCaptionAnalysis(body.analysis ?? null);
    } catch {
      setMessage(m.analyze.requestFailed);
    } finally {
      setPending(false);
    }
  }

  const related = references.filter((item) => item.track === track).slice(0, 6);
  const tracks = ["series", "single_image", "student", "youth"] as const;
  const emptyFields = [m.analyze.subject, m.analyze.narrative, m.analyze.theme, m.analyze.mood, m.analyze.compositionJudge, m.analyze.match];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="glass glass-cobalt p-6">
        <FactMark>{m.analyze.localFact}</FactMark>
        <h2 className="mt-4 text-xl font-medium">{m.analyze.localTitle}</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{m.analyze.localBody}</p>
        <input className="mt-4 block w-full text-sm" type="file" accept="image/*" onChange={(event) => void onFile(event.target.files?.[0] ?? null)} />
        {preview ? (
          // User's own local file preview, not a contest image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={m.analyze.previewAlt} className="mt-4 max-h-72 w-full rounded-2xl object-contain" />
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">{m.analyze.emptyFile}</div>
        )}
        {fileFact ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <FactRow label={m.analyze.fileName} value={fileFact.name} />
            <FactRow label={m.analyze.type} value={fileFact.type} />
            <FactRow label={m.analyze.size} value={translate(m, "analyze.bytes", { n: fileFact.size })} />
            <FactRow label={m.analyze.dimensions} value={`${fileFact.width} × ${fileFact.height}`} />
            <FactRow label={m.analyze.aspect} value={aspectLabel(fileFact.width, fileFact.height)} />
            <FactRow label={m.analyze.orientation} value={orientationOf(fileFact.width, fileFact.height)} />
          </dl>
        ) : null}
        {measurement ? (
          <div className="mt-4">
            <FactMark>{m.analyze.measured}</FactMark>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">{translate(m, "analyze.measuredNote", { method: measurement.method })}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <FactRow label={m.analyze.samples} value={String(measurement.sampleCount)} numeric />
              <FactRow label={m.analyze.luminance} value={measurement.meanLuminance === null ? "—" : String(measurement.meanLuminance)} numeric />
              <FactRow label={m.analyze.shadow} value={share(measurement.shadowShare)} numeric />
              <FactRow label={m.analyze.highlight} value={share(measurement.highlightShare)} numeric />
              <FactRow label={m.analyze.saturation} value={measurement.meanSaturation === null ? "—" : String(measurement.meanSaturation)} numeric />
              <FactRow label={m.analyze.warm} value={measurement.warmCool === null ? "—" : String(measurement.warmCool)} numeric />
              <FactRow label={m.analyze.hue} value={measurement.dominantHue ?? m.analyze.unnamed} />
            </dl>
          </div>
        ) : null}
      </section>
      <section className="flex flex-col gap-4">
        <div className="glass glass-ember p-6">
          <InferenceMark />
          <h2 className="mt-4 text-xl font-medium">{m.analyze.captionTitle}</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{m.analyze.captionBody}</p>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder={m.analyze.placeholder}
            className="mt-4 min-h-24 w-full text-sm"
          />
          <button type="button" disabled={pending || caption.trim().length === 0} onClick={() => void analyzeCaption()} className="btn-glow mt-4">
            <LinearIcon icon={ScanLine} />
            {pending ? m.analyze.pending : m.analyze.submit}
          </button>
          {message ? <p className="mt-4 text-xs leading-6 text-muted-foreground">{message}</p> : null}
          {captionAnalysis ? (
            <dl className="mt-4 grid gap-2">
              {(
                [
                  [m.analyze.subjectScene, captionAnalysis.subjectScene],
                  [m.analyze.composition, captionAnalysis.composition],
                  [m.analyze.light, captionAnalysis.light],
                  [m.analyze.color, captionAnalysis.color],
                  [m.analyze.narrative, captionAnalysis.narrative],
                  [m.analyze.theme, captionAnalysis.theme],
                  [m.analyze.mood, captionAnalysis.mood],
                  [m.analyze.technique, captionAnalysis.technique],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border px-4 py-2 text-sm">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd>{value ?? <span className="text-muted-foreground">{m.analyze.notAnalyzed}</span>}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {emptyFields.map((field) => (
                <li key={field} className="flex justify-between rounded-lg border border-border px-4 py-2">
                  <span>{field}</span>
                  <span>{m.analyze.notAnalyzed}</span>
                </li>
              ))}
            </ul>
          )}
          {captionAnalysis?.evidence.map((item) => (
            <blockquote key={`${item.dimension}-${item.label}`} className="mt-2 border-l-2 border-border pl-4 text-xs leading-6">
              {item.quote}
            </blockquote>
          ))}
        </div>
        <div className="glass glass-plum p-6">
          <p className="text-xs text-muted-foreground">{m.analyze.catalogNote}</p>
          <select className="mt-4 text-sm" value={track} onChange={(event) => setTrack(event.target.value as NormalizedTrack)}>
            {tracks.map((value) => (
              <option key={value} value={value}>
                {m.reports[value]}
              </option>
            ))}
          </select>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {related.map((item) => (
              <li key={item.id}>
                <a className="underline-offset-2 hover:underline" href={item.href}>
                  <span className="font-num">{item.year}</span>
                  {" · "}
                  {item.rawCategory} · {displayTitle(item.title)}
                </a>
                <span className="ml-2 text-xs text-muted-foreground">{peopleLine(item.photographers.map((person) => person.name))}</span>
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

function FactRow({ label, value, numeric = false }: { label: string; value: string; numeric?: boolean }) {
  return (
    <div className="rounded-lg border border-border px-4 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={numeric ? "font-num break-all" : "break-all"}>{value}</dd>
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
