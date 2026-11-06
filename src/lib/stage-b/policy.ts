/**
 * Cut 2026-11-06-B2.
 * Owner approved this cut on 2026-11-06 (Asia/Shanghai). No clock time was given;
 * confirmedAt is the start of that calendar day in that zone, not a measured instant.
 * Winner pixels and jury sample pixels may be fetched from any publicly reachable
 * web page. Every cached pixel must keep sourceUrl, downloadedAt, and storagePath.
 * Official hosts are sourceKind=official. Every other public page is sourceKind=web_other.
 * Uncertain identity is unverified_match. Unclear rights are rights_unverified.
 * Those two are never written into the fact column as official facts.
 * Marketplace publish stays off. Stage A live crawl is not claimed done.
 */
export const IMAGE_POLICY = "B2" as const;

export const IMAGE_POLICY_CONFIRMED_AT = "2026-11-06T00:00:00+08:00";

export const STAGE_B_CUT = "2026-11-06-B2" as const;

export const imagePolicyRecord = {
  cut: STAGE_B_CUT,
  policy: IMAGE_POLICY,
  confirmedAt: IMAGE_POLICY_CONFIRMED_AT,
  approvedOn: "2026-11-06",
  approvedZone: "Asia/Shanghai",
  downloadAndCache: true,
  requiresSourceUrl: true,
  requiresDownloadedAt: true,
  requiresStoragePath: true,
  publicWebSources: true,
  nonOfficialAuditedSources: true,
  sourceKinds: ["official", "web_other"],
  marketplacePublish: false,
  unlabeledSources: false,
  stageALiveCrawlClaimed: false,
  externalVisionCalled: false,
} as const;
