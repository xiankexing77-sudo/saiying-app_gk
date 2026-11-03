import { TRACK_LABEL } from "@/lib/catalog";

export function GET() {
  return Response.json({
    reports: (["series", "single_image", "student", "youth"] as const).map((track) => ({
      id: track,
      title: `${TRACK_LABEL[track].zh} 2025 / 2026 事实对照`,
      inference: "not_generated",
    })),
  });
}
