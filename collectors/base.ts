export type EditionRef = {
  year: number;
  officialLabel: string;
};

export type ExtractedWinner = {
  title: string | null;
  photographerNames: string[];
  year: number;
  rawCompetitionName: string;
  normalizedTrack: string;
  rawCategory: string;
  normalizedCategory: string;
  awardNames: string[];
  description: string | null;
  officialSourceUrl: string;
  sourcePageTitle: string | null;
  workForm: "series" | "single";
};

export type ExtractedJury = {
  name: string;
  year: number;
  rawTracks: string[];
  roleTitle: string;
  institution: string | null;
  officialProfileUrl: string;
};

export interface CompetitionAdapter {
  id: string;
  discoverEditions(): EditionRef[];
  extractCategories(edition: EditionRef): { rawName: string; normalizedName: string; track: string }[];
  extractAwards(edition: EditionRef): { name: string; track: string; scope: "overall" | "category" }[];
  extractWinners(edition: EditionRef): ExtractedWinner[];
  extractJuries(edition: EditionRef): ExtractedJury[];
  extractOfficialImages(edition: EditionRef): { workKey: string; officialImageUrl: string | null; rightsStatus: string }[];
}
