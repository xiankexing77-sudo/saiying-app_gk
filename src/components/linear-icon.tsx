import type { LucideIcon } from "lucide-react";
import { ICON_STROKE } from "@/lib/design/tokens";

export function LinearIcon({ icon: Icon, size = 16 }: { icon: LucideIcon; size?: number }) {
  return <Icon absoluteStrokeWidth aria-hidden size={size} strokeWidth={ICON_STROKE} />;
}
