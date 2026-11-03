/** PRD §2.2 官方入口清单。采集器只允许从这些 URL 起步。 */

export const OFFICIAL_HOSTS = new Set(["www.worldphoto.org", "worldphoto.org"]);

export const ENTRY_ALLOWLIST = [
  "https://www.worldphoto.org/sony-world-photography-awards",
  "https://www.worldphoto.org/sony-world-photography-awards/2025-judges",
  "https://www.worldphoto.org/2026-judges",
  "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025",
  "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
  "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/overall-winners-2026",
] as const;

export type EntryUrl = (typeof ENTRY_ALLOWLIST)[number];

export function canonicalize(input: string) {
  const url = new URL(input);
  url.hash = "";
  url.search = "";
  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url;
}

export function assertEntryUrl(input: string): EntryUrl {
  let url: URL;
  try {
    url = canonicalize(input);
  } catch {
    throw new Error("入口 URL 无法解析");
  }
  if (url.protocol !== "https:") {
    throw new Error("入口必须是 https");
  }
  if (!OFFICIAL_HOSTS.has(url.hostname)) {
    throw new Error(`拒绝非官方主机：${url.hostname}`);
  }
  if (url.username || url.password) {
    throw new Error("入口 URL 不能携带凭据");
  }
  const normalized = url.toString();
  const match = ENTRY_ALLOWLIST.find((allowed) => allowed === normalized);
  if (!match) {
    throw new Error(`不在 §2.2 入口清单中：${normalized}`);
  }
  return match;
}

export function isOfficialHost(input: string) {
  try {
    return OFFICIAL_HOSTS.has(canonicalize(input).hostname);
  } catch {
    return false;
  }
}
