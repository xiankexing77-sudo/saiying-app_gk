import { connection } from "next/server";
import { listJuryPublicProfiles } from "@/lib/stage-b/juries";

export async function GET(request: Request) {
  await connection();
  const year = new URL(request.url).searchParams.get("year");
  const parsed = year === "2025" || year === "2026" ? Number(year) : undefined;
  return Response.json({
    liveCrawl: false,
    stageA: "fixture_only_not_done",
    juries: listJuryPublicProfiles(parsed),
  });
}
