import { connection } from "next/server";
import { aggregateWinners } from "@/lib/stage-b/winners";

export async function GET(request: Request) {
  await connection();
  const year = new URL(request.url).searchParams.get("year");
  const parsed = year === "2025" || year === "2026" ? Number(year) : undefined;
  const winners = aggregateWinners(parsed ? { year: parsed } : undefined);
  return Response.json({
    liveCrawl: false,
    stageA: "fixture_only_not_done",
    collectionMode: "curated_seed",
    winners,
  });
}
