import { ENTRY_ALLOWLIST } from "./sony/allowlist";
import type { SourceRole } from "./types";

type RoleSource = {
  url: string;
  publisher: "worldphoto.org" | "sony_press";
};

/** 官方主入口（PRD §2.2）优先于主办方其他公开页，再优先于合作方新闻稿。 */
export function roleForSource(source: RoleSource): SourceRole {
  if ((ENTRY_ALLOWLIST as readonly string[]).includes(source.url)) return "official_primary";
  if (source.publisher === "worldphoto.org") return "official_related";
  return "organizer_mirror";
}

export function roleRank(role: SourceRole) {
  if (role === "official_primary") return 0;
  if (role === "official_related") return 1;
  return 2;
}

export function roleLabel(role: SourceRole) {
  if (role === "official_primary") return "官方主入口";
  if (role === "official_related") return "主办方相关页";
  return "合作方新闻稿";
}
