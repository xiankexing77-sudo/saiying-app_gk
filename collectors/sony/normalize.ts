import { TRACK_MAPPING_VERSION } from "../../src/lib/data/sources";
import type { NormalizedTrack, WorkForm } from "../../src/lib/data/types";

export type TrackMapping = {
  rawName: string;
  normalizedTrack: NormalizedTrack;
  normalizedLabel: string;
  workForm: WorkForm;
  mappingVersion: string;
};

export const TRACK_MAPPINGS: TrackMapping[] = [
  {
    rawName: "Professional competition",
    normalizedTrack: "series",
    normalizedLabel: "Series",
    workForm: "series",
    mappingVersion: TRACK_MAPPING_VERSION,
  },
  {
    rawName: "Open competition",
    normalizedTrack: "single_image",
    normalizedLabel: "Single Image",
    workForm: "single",
    mappingVersion: TRACK_MAPPING_VERSION,
  },
  {
    rawName: "Student competition",
    normalizedTrack: "student",
    normalizedLabel: "Student",
    workForm: "series",
    mappingVersion: TRACK_MAPPING_VERSION,
  },
  {
    rawName: "Youth competition",
    normalizedTrack: "youth",
    normalizedLabel: "Youth",
    workForm: "single",
    mappingVersion: TRACK_MAPPING_VERSION,
  },
];

export function normalizeTrack(rawName: string) {
  return TRACK_MAPPINGS.find((mapping) => mapping.rawName === rawName) ?? null;
}
