import { connection } from "next/server";
import { buildStageBReport } from "@/lib/stage-b/report";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const year = url.searchParams.get("year");
  const years = year === "2025" || year === "2026" ? [Number(year)] : [2025, 2026];
  const report = buildStageBReport({ years });
  const headers: Record<string, string> = { "content-type": "application/json; charset=utf-8" };
  if (url.searchParams.get("download") === "1") {
    headers["content-disposition"] = 'attachment; filename="stage-b-report.json"';
  }
  return new Response(JSON.stringify(report, null, 2), { headers });
}
