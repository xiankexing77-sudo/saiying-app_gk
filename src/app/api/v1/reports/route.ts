import { compareEditions, TRACK_LABEL } from "@/lib/catalog";

export function GET() {
  return Response.json({
    reports: (["series", "single_image", "student", "youth"] as const).map((track) => {
      const comparison = compareEditions(track);
      return {
        id: track,
        title: `${TRACK_LABEL[track].zh} 2025 / 2026 事实对照`,
        pixelTrend: "not_generated",
        inference: comparison.ok ? comparison.inference.status : "not_generated",
      };
    }),
  });
}
