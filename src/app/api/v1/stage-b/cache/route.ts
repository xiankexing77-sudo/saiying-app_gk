import { connection } from "next/server";
import { readImageAudits } from "@/lib/stage-b/cache";

export async function GET() {
  await connection();
  const images = readImageAudits();
  return Response.json({
    policy: "C",
    liveCrawl: false,
    images: images.map((item) => ({
      workId: item.workId,
      fixtureId: item.fixtureId,
      sourceUrl: item.sourceUrl,
      pageUrl: item.pageUrl,
      downloadedAt: item.downloadedAt,
      storagePath: item.storagePath,
      relativePath: item.relativePath,
      byteLength: item.byteLength,
      sha256: item.sha256,
      detectedFormat: item.detectedFormat,
      policy: item.policy,
      liveCrawl: item.liveCrawl,
    })),
  });
}
