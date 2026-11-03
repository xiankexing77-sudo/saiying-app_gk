import type { StyleDimension } from "../../src/lib/data/types";

/** 一条线索只对应陈述里已经写出的做法或对象，不是像素判断。 */
export const CLAIM_CATALOG: Record<string, { dimension: StyleDimension; label: string }> = {
  collage: { dimension: "visual_style", label: "拼贴" },
  found_or_archival_image: { dimension: "visual_style", label: "现成或档案图像" },
  analogue_with_digital: { dimension: "visual_style", label: "胶片与数字介入" },
  sea_surface: { dimension: "subject", label: "海面" },
  natural_light: { dimension: "subject", label: "自然光" },
  nature_and_walk: { dimension: "subject", label: "行走与自然" },
  women_only_village: { dimension: "subject", label: "无男性村落中的女性" },
  food_labor: { dimension: "subject", label: "从事供食的人" },
  colour_as_pigment: { dimension: "color", label: "色彩汇流" },
  coloured_shapes: { dimension: "color", label: "彩色形状" },
  shape_directs_gaze: { dimension: "composition", label: "形状引导视线" },
  grid: { dimension: "composition", label: "网格" },
  text_with_image: { dimension: "narrative", label: "文字与图像并置" },
  grief_and_memory: { dimension: "theme", label: "哀恸与记忆" },
};

export const REQUIRED_SAMPLE_GROUPS = 3;
