/**
 * Cut 2026-11-05-B image policy C.
 * Owner confirmed the red-line change at 2026-11-06 00:08 Asia/Shanghai:
 * this cut may download and cache SWPA official winner pixels and feed a vision reader,
 * and every cached image must keep its source URL and download time.
 * Marketplace publish and unlabeled sources stay forbidden.
 * Stage A collectors are unchanged and are not described as a finished live crawl.
 */
export const IMAGE_POLICY = "C" as const;

export const IMAGE_POLICY_CONFIRMED_AT = "2026-11-06T00:08:00+08:00";

export const STAGE_B_CUT = "2026-11-05-B";

export const imagePolicyRecord = {
  cut: STAGE_B_CUT,
  policy: IMAGE_POLICY,
  confirmedAt: IMAGE_POLICY_CONFIRMED_AT,
  downloadAndCache: true,
  requiresSourceUrl: true,
  requiresDownloadedAt: true,
  marketplacePublish: false,
  unlabeledSources: false,
  stageALiveCrawlClaimed: false,
  externalVisionCalled: false,
} as const;
