import { connection } from "next/server";
import { readImageCache } from "@/lib/stage-b/cache";
import { IMAGE_POLICY, STAGE_B_CUT } from "@/lib/stage-b/policy";

export async function GET() {
  await connection();
  const cache = readImageCache();
  return Response.json({
    cut: STAGE_B_CUT,
    policy: IMAGE_POLICY,
    liveCrawl: false,
    stageA: "fixture_only_not_done",
    images: cache.audits.map((item) => ({
      subjectKind: item.subjectKind,
      workId: item.workId,
      fixtureId: item.fixtureId,
      juryId: item.juryId,
      sourceUrl: item.sourceUrl,
      pageUrl: item.pageUrl,
      sourceKind: item.sourceKind,
      identityMatch: item.identityMatch,
      rightsStatus: item.rightsStatus,
      downloadedAt: item.downloadedAt,
      storagePath: item.storagePath,
      relativePath: item.relativePath,
      byteLength: item.byteLength,
      sha256: item.sha256,
      detectedFormat: item.detectedFormat,
      policy: item.policy,
      liveCrawl: item.liveCrawl,
    })),
    unlabeled: cache.unlabeled,
  });
}
