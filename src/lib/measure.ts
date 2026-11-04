export type Rgb = { r: number; g: number; b: number };

export type SampleMeasurement = {
  kind: "measurement";
  sampleCount: number;
  meanLuminance: number | null;
  shadowShare: number | null;
  highlightShare: number | null;
  meanSaturation: number | null;
  warmCool: number | null;
  dominantHue: string | null;
  method: string;
};

const HUE_NAMES = ["红", "橙", "黄", "绿", "青", "蓝", "紫"] as const;

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function hueName(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  if (hue < 20 || hue >= 345) return "红";
  if (hue < 45) return "橙";
  if (hue < 70) return "黄";
  if (hue < 160) return "绿";
  if (hue < 200) return "青";
  if (hue < 260) return "蓝";
  return "紫";
}

/** 只统计调用方已经拿到的像素样本。不识别主体，也不命名没有占优的颜色。 */
export function measureSamples(samples: Rgb[]): SampleMeasurement {
  const method = "对调用方提供的 RGB 样本计算亮度、饱和度和色相桶。样本不足或不集中时不命名主色。";
  if (samples.length === 0) {
    return {
      kind: "measurement",
      sampleCount: 0,
      meanLuminance: null,
      shadowShare: null,
      highlightShare: null,
      meanSaturation: null,
      warmCool: null,
      dominantHue: null,
      method,
    };
  }
  let luminance = 0;
  let saturation = 0;
  let warmCool = 0;
  let shadow = 0;
  let highlight = 0;
  let chromatic = 0;
  const buckets = Object.fromEntries(HUE_NAMES.map((name) => [name, 0])) as Record<(typeof HUE_NAMES)[number], number>;
  for (const sample of samples) {
    const red = sample.r / 255;
    const green = sample.g / 255;
    const blue = sample.b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const y = 0.2126 * sample.r + 0.7152 * sample.g + 0.0722 * sample.b;
    luminance += y;
    const sat = max === 0 ? 0 : (max - min) / max;
    saturation += sat;
    warmCool += sample.r - sample.b;
    if (y < 40) shadow += 1;
    if (y > 220) highlight += 1;
    if (sat >= 0.25 && max > 0) {
      chromatic += 1;
      buckets[hueName(red, green, blue)] += 1;
    }
  }
  const count = samples.length;
  const ranked = HUE_NAMES.map((name) => [name, buckets[name]] as const).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];
  const second = ranked[1];
  const dominantHue =
    top && chromatic > 0 && top[1] / chromatic >= 0.35 && top[1] >= (second?.[1] ?? 0) * 1.4 && top[1] >= 8
      ? top[0]
      : null;
  return {
    kind: "measurement",
    sampleCount: count,
    meanLuminance: round(luminance / count),
    shadowShare: round(shadow / count),
    highlightShare: round(highlight / count),
    meanSaturation: round(saturation / count),
    warmCool: round(warmCool / count),
    dominantHue,
    method,
  };
}

export function orientationOf(width: number, height: number) {
  if (width <= 0 || height <= 0) return "未知";
  if (width > height * 1.05) return "横幅";
  if (height > width * 1.05) return "竖幅";
  return "方幅";
}

export function aspectLabel(width: number, height: number) {
  if (width <= 0 || height <= 0) return "未知";
  return `${round(width / height)} : 1`;
}
