import { listLibrary, type LibraryItem } from "../catalog";
import { database } from "../data/seed";
import { loadOfficialImageFixture, type OfficialImageExport, type OfficialImageFixture } from "./fixture";

export type WinnerAuthor = {
  name: string;
  sourceUrl: string;
  country: string | null;
};

export type WinnerAggregate = {
  fixtureId: string;
  editionYear: number;
  name: string | null;
  authors: WinnerAuthor[];
  awards: string[];
  category: string;
  rawTrack: string;
  sourceUrl: string;
  sourcePageTitle: string;
  officialPageUrl: string;
  collectionMode: "curated_seed";
  liveCrawl: false;
  stageALiveCrawl: false;
  imageExport: OfficialImageExport | null;
};

function pagesFor(item: LibraryItem) {
  if (item.form === "series") {
    const series = database.series.find((row) => row.id === item.id);
    return {
      sourceUrl: series?.provenance.sourceUrl ?? "",
      sourcePageTitle: series?.provenance.sourcePageTitle ?? "",
      officialPageUrl: series?.officialSourceUrl ?? "",
    };
  }
  const photo = database.photographs.find((row) => row.id === item.id);
  return {
    sourceUrl: photo?.provenance.sourceUrl ?? "",
    sourcePageTitle: photo?.provenance.sourcePageTitle ?? "",
    officialPageUrl: photo?.officialPageUrl ?? "",
  };
}

export function aggregateWinners(input?: { year?: number; fixture?: OfficialImageFixture }): WinnerAggregate[] {
  const fixture = input?.fixture ?? loadOfficialImageFixture();
  const exports = new Map(fixture.images.map((item) => [item.workId, item]));
  return listLibrary()
    .filter((item) => input?.year === undefined || item.year === input.year)
    .map((item) => {
      const pages = pagesFor(item);
      return {
        fixtureId: item.id,
        editionYear: item.year,
        name: item.title,
        authors: item.photographers.map((person) => ({
          name: person.name,
          sourceUrl: person.provenance.sourceUrl,
          country: person.country,
        })),
        awards: item.awards,
        category: item.rawCategory,
        rawTrack: item.rawTrack,
        sourceUrl: pages.sourceUrl,
        sourcePageTitle: pages.sourcePageTitle,
        officialPageUrl: pages.officialPageUrl,
        collectionMode: "curated_seed" as const,
        liveCrawl: false as const,
        stageALiveCrawl: false as const,
        imageExport: exports.get(item.id) ?? null,
      };
    });
}
