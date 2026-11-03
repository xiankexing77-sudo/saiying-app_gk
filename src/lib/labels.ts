import { TRACK_LABEL } from "./catalog";
import type { NormalizedTrack } from "./data/types";

export function trackZh(track: NormalizedTrack) {
  return TRACK_LABEL[track].zh;
}

export function displayTitle(title: string | null) {
  return title ?? "标题未在来源中给出";
}

export function peopleLine(names: string[]) {
  return names.join("、");
}
