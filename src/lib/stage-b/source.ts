import { parsePublicHttps } from "../../../collectors/safety";

export type SourceKind = "official" | "web_other";

export type IdentityMatch = "verified" | "unverified_match";

export type PixelRights = "rights_blocked" | "rights_unverified";

export type PixelSubject = "winner" | "jury";

export type PublicPixelSource = {
  subjectKind: PixelSubject;
  subjectId: string;
  sourceUrl: string;
  pageUrl: string;
  note?: string;
};

export type OfficialExportRef = {
  workId: string;
  sourceUrl: string;
};

const OFFICIAL_HOSTS = new Set(["www.worldphoto.org", "worldphoto.org"]);

export function classifySourceKind(input: string): SourceKind {
  const host = parsePublicHttps(input).hostname.toLowerCase();
  return OFFICIAL_HOSTS.has(host) ? "official" : "web_other";
}

export function classifyIngest(input: {
  subjectKind: PixelSubject;
  subjectId: string;
  sourceUrl: string;
  officialExports: OfficialExportRef[];
}): { sourceKind: SourceKind; identityMatch: IdentityMatch; rightsStatus: PixelRights } {
  const sourceKind = classifySourceKind(input.sourceUrl);
  const matched = input.officialExports.some((item) => item.workId === input.subjectId && item.sourceUrl === input.sourceUrl);
  if (input.subjectKind === "winner" && sourceKind === "official" && matched) {
    return { sourceKind, identityMatch: "verified", rightsStatus: "rights_blocked" };
  }
  return { sourceKind, identityMatch: "unverified_match", rightsStatus: "rights_unverified" };
}

/** Fact-column gate. Re-checks the URL host so a stored label cannot promote web_other. */
export function isOfficialFactPixel(input: {
  sourceUrl: string;
  sourceKind: string;
  identityMatch: string;
  rightsStatus: string;
}) {
  let sourceKind: SourceKind;
  try {
    sourceKind = classifySourceKind(input.sourceUrl);
  } catch {
    return false;
  }
  return sourceKind === "official" && input.sourceKind === "official" && input.identityMatch === "verified" && input.rightsStatus === "rights_blocked";
}

export function withheldReasons(input: { sourceKind: string; identityMatch: string; rightsStatus: string }) {
  const reasons: Array<"web_other" | "unverified_match" | "rights_unverified"> = [];
  if (input.sourceKind === "web_other") reasons.push("web_other");
  if (input.identityMatch === "unverified_match") reasons.push("unverified_match");
  if (input.rightsStatus === "rights_unverified") reasons.push("rights_unverified");
  return reasons;
}

export function parsePublicSources(input: unknown): PublicPixelSource[] | { error: string } {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return { error: "publicSources 必须是数组。" };
  const sources: PublicPixelSource[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return { error: "publicSources 有空条目。" };
    const row = item as Partial<PublicPixelSource>;
    if (row.subjectKind !== "winner" && row.subjectKind !== "jury") {
      return { error: "publicSources.subjectKind 只能是 winner 或 jury。" };
    }
    if (!row.subjectId?.trim() || !row.sourceUrl?.trim() || !row.pageUrl?.trim()) {
      return { error: "publicSources 缺少 subjectId、sourceUrl 或 pageUrl。" };
    }
    sources.push({
      subjectKind: row.subjectKind,
      subjectId: row.subjectId.trim(),
      sourceUrl: row.sourceUrl.trim(),
      pageUrl: row.pageUrl.trim(),
      note: typeof row.note === "string" ? row.note.trim() : "",
    });
  }
  return sources;
}
