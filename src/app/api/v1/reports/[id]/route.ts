import { compareEditions } from "@/lib/catalog";
import type { NormalizedTrack } from "@/lib/data/types";

const tracks = new Set<NormalizedTrack>(["series", "single_image", "student", "youth"]);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!tracks.has(id as NormalizedTrack)) {
    return Response.json({ message: "没有这份报告" }, { status: 404 });
  }
  const comparison = compareEditions(id as NormalizedTrack);
  return Response.json({ id, kind: { facts: "fact", inferences: "inference" }, comparison });
}
