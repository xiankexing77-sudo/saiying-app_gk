import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { decode } from "jpeg-js";
import { auditComplete, detectImageFormat, type ImageAudit } from "./cache";

export const VISION_MODEL_NAME = "pji-vision-cache";
export const VISION_MODEL_VERSION = "measure-1.0.0";

export type VisionMeasurement = {
  kind: "fact";
  workId: string;
  fixtureId: string;
  sourceUrl: string;
  pageUrl: string;
  downloadedAt: string;
  storagePath: string;
  sha256: string;
  detectedFormat: ImageAudit["detectedFormat"];
  width: number;
  height: number;
  pixelsRead: boolean;
  meanLuminance: number | null;
  meanRgb: [number, number, number] | null;
  quote: string;
  modelName: typeof VISION_MODEL_NAME;
  modelVersion: typeof VISION_MODEL_VERSION;
  note: string;
};

export type VisionRefusal = {
  workId: string | null;
  sourceUrl: string | null;
  reason: string;
};

const memory = new Map<string, VisionMeasurement>();

export function webpSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 30 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") return null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const tag = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (tag === "VP8X" && size >= 10 && start + 10 <= bytes.length) {
      return { width: 1 + bytes.readUIntLE(start + 4, 3), height: 1 + bytes.readUIntLE(start + 7, 3) };
    }
    if (tag === "VP8 " && start + 10 < bytes.length) {
      const chunk = bytes.subarray(start, Math.min(bytes.length, start + size));
      const marker = chunk.indexOf(Buffer.from([0x9d, 0x01, 0x2a]));
      if (marker >= 0 && marker + 7 <= chunk.length) {
        return { width: chunk.readUInt16LE(marker + 3) & 0x3fff, height: chunk.readUInt16LE(marker + 5) & 0x3fff };
      }
    }
    if (tag === "VP8L" && start + 5 <= bytes.length && bytes[start] === 0x2f) {
      const bits = bytes.readUInt32LE(start + 1);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    const next = start + size + (size % 2);
    if (next <= offset) break;
    offset = next;
  }
  return null;
}

function measurementQuote(input: { width: number; height: number; pixelsRead: boolean; meanLuminance: number | null }) {
  if (!input.pixelsRead || input.meanLuminance === null) {
    return `缓存图容器尺寸 ${input.width}×${input.height}。像素没有解码，所以不写色彩或风格。`;
  }
  return `缓存图测量 ${input.width}×${input.height}，抽样平均亮度 ${input.meanLuminance}（0–255）。`;
}

export function measureAuditedBytes(audit: ImageAudit | null, bytes: Buffer | null): { ok: true; measurement: VisionMeasurement } | { ok: false; refusal: VisionRefusal } {
  if (!auditComplete(audit) || !bytes || bytes.length === 0) {
    return {
      ok: false,
      refusal: {
        workId: audit?.workId ?? null,
        sourceUrl: audit?.sourceUrl ?? null,
        reason: "没有来源 URL、下载时间或像素，不进入视觉读取。",
      },
    };
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== audit.sha256 || bytes.length !== audit.byteLength) {
    return { ok: false, refusal: { workId: audit.workId, sourceUrl: audit.sourceUrl, reason: "缓存字节和审计摘要不一致，不进入视觉读取。" } };
  }
  if (detectImageFormat(bytes) !== audit.detectedFormat) {
    return { ok: false, refusal: { workId: audit.workId, sourceUrl: audit.sourceUrl, reason: "缓存格式和审计记录不一致，不进入视觉读取。" } };
  }
  const cached = memory.get(digest);
  if (cached && cached.workId === audit.workId && cached.downloadedAt === audit.downloadedAt) {
    return { ok: true, measurement: cached };
  }
  try {
    const measurement = measureFormat(audit, bytes);
    memory.set(digest, measurement);
    return { ok: true, measurement };
  } catch (error) {
    return {
      ok: false,
      refusal: {
        workId: audit.workId,
        sourceUrl: audit.sourceUrl,
        reason: error instanceof Error ? error.message : "视觉读取失败",
      },
    };
  }
}

function measureFormat(audit: ImageAudit, bytes: Buffer): VisionMeasurement {
  let width = 0;
  let height = 0;
  let pixelsRead = false;
  let meanLuminance: number | null = null;
  let meanRgb: [number, number, number] | null = null;
  if (audit.detectedFormat === "jpeg") {
    const decoded = decode(bytes, { useTArray: true, maxResolutionInMP: 40, maxMemoryUsageInMB: 256 });
    width = decoded.width;
    height = decoded.height;
    const sample = sampleRgb(decoded.data, decoded.width * decoded.height);
    pixelsRead = true;
    meanLuminance = sample.luminance;
    meanRgb = sample.rgb;
  } else if (audit.detectedFormat === "png") {
    const size = pngSize(bytes);
    if (!size) throw new Error("PNG 尺寸无法读取");
    width = size.width;
    height = size.height;
  } else {
    const size = webpSize(bytes);
    if (!size) throw new Error("WebP 尺寸无法读取");
    width = size.width;
    height = size.height;
  }
  if (width < 1 || height < 1) throw new Error("图像尺寸无效");
  return {
    kind: "fact",
    workId: audit.workId,
    fixtureId: audit.fixtureId,
    sourceUrl: audit.sourceUrl,
    pageUrl: audit.pageUrl,
    downloadedAt: audit.downloadedAt,
    storagePath: audit.storagePath,
    sha256: audit.sha256,
    detectedFormat: audit.detectedFormat,
    width,
    height,
    pixelsRead,
    meanLuminance,
    meanRgb,
    quote: measurementQuote({ width, height, pixelsRead, meanLuminance }),
    modelName: VISION_MODEL_NAME,
    modelVersion: VISION_MODEL_VERSION,
    note: audit.note,
  };
}

function sampleRgb(data: Uint8Array, pixels: number) {
  const step = Math.max(1, Math.floor(pixels / 20_000));
  let count = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (let index = 0; index < pixels; index += step) {
    const offset = index * 4;
    red += data[offset] ?? 0;
    green += data[offset + 1] ?? 0;
    blue += data[offset + 2] ?? 0;
    count += 1;
  }
  const rgb: [number, number, number] = [
    Math.round(red / count),
    Math.round(green / count),
    Math.round(blue / count),
  ];
  const luminance = Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
  return { rgb, luminance };
}

function pngSize(bytes: Buffer) {
  if (detectImageFormat(bytes) !== "png" || bytes.length < 24) return null;
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

export function measureAuditedFiles(audits: ImageAudit[], files = new Map<string, Buffer>()): { measurements: VisionMeasurement[]; refusals: VisionRefusal[] } {
  const measurements: VisionMeasurement[] = [];
  const refusals: VisionRefusal[] = [];
  const allowed = new Set(audits.filter(auditComplete).map((item) => item.storagePath));
  for (const [file] of files) {
    if (!allowed.has(file)) {
      refusals.push({ workId: null, sourceUrl: null, reason: `无审计文件不进入视觉读取：${file}` });
    }
  }
  for (const audit of audits) {
    if (!auditComplete(audit) || !existsSync(/*turbopackIgnore: true*/ audit.storagePath)) {
      refusals.push({
        workId: audit?.workId ?? null,
        sourceUrl: audit?.sourceUrl ?? null,
        reason: "审计记录不完整或文件不存在，不进入视觉读取。",
      });
      continue;
    }
    const bytes = readFileSync(/*turbopackIgnore: true*/ audit.storagePath);
    const result = measureAuditedBytes(audit, bytes);
    if (result.ok) measurements.push(result.measurement);
    else refusals.push(result.refusal);
  }
  return { measurements, refusals };
}
