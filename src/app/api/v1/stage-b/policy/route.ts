import { connection } from "next/server";
import { imagePolicyRecord } from "@/lib/stage-b/policy";

export async function GET() {
  await connection();
  return Response.json({ policy: imagePolicyRecord, liveCrawl: false, stageA: "fixture_only_not_done", marketplace: false });
}
