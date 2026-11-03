import { listCategories, listLibrary, listTracks } from "../../src/lib/catalog";
import { database } from "../../src/lib/data/seed";
import type { CompetitionAdapter, EditionRef, ExtractedJury, ExtractedWinner } from "../base";
import { collectCompetition, collectEdition } from "../multi-source";
import { assertEntryUrl, ENTRY_ALLOWLIST } from "./allowlist";
import { dedupeRecords } from "./dedupe";

/**
 * SonyAdapter 的 POC 实现。
 * 它只接受 §2.2 入口清单，并返回已核对的种子，不发起网络请求，也不补写缺失字段。
 */
export class SonyAdapter implements CompetitionAdapter {
  id = "sony-world-photography-awards";

  discoverEditions(): EditionRef[] {
    assertEntryUrl(ENTRY_ALLOWLIST[0]);
    return database.editions.map((edition) => ({
      year: edition.year,
      officialLabel: edition.officialLabel,
    }));
  }

  extractCategories(edition: EditionRef) {
    const editionId = `swpa-${edition.year}`;
    if (!database.editions.some((item) => item.id === editionId)) {
      return [];
    }
    return listCategories().map((category) => ({
      rawName: category.rawName,
      normalizedName: category.normalizedName,
      track: category.normalizedTrack,
    }));
  }

  extractAwards(edition: EditionRef) {
    return database.awards
      .filter((award) => award.editionId === `swpa-${edition.year}`)
      .map((award) => ({ name: award.name, track: award.normalizedTrack, scope: award.scope }));
  }

  extractWinners(edition: EditionRef): ExtractedWinner[] {
    const entry =
      edition.year === 2026
        ? "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2026/overall-winners-2026"
        : "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025";
    assertEntryUrl(entry);
    const rows = listLibrary().filter((item) => item.year === edition.year);
    const extracted = rows.map((item) => {
      const record = item.form === "series"
        ? database.series.find((series) => series.id === item.id)
        : database.photographs.find((photo) => photo.id === item.id);
      return {
        title: item.title,
        photographerNames: item.photographers.map((person) => person.name),
        year: item.year,
        rawCompetitionName: item.rawTrack,
        normalizedTrack: item.track,
        rawCategory: item.rawCategory,
        normalizedCategory: item.rawCategory,
        awardNames: item.awards,
        description: item.description,
        officialSourceUrl: record?.provenance.sourceUrl ?? item.rawTrack,
        sourcePageTitle: record?.provenance.sourcePageTitle ?? null,
        workForm: item.form,
      };
    });
    const deduped = dedupeRecords(
      extracted.map((row) => ({
        ...row,
        officialImageUrl: null,
      })),
    ).kept;
    return deduped.map((row) => ({
      title: row.title,
      photographerNames: row.photographerNames,
      year: row.year,
      rawCompetitionName: row.rawCompetitionName,
      normalizedTrack: row.normalizedTrack,
      rawCategory: row.rawCategory,
      normalizedCategory: row.normalizedCategory,
      awardNames: row.awardNames,
      description: row.description,
      officialSourceUrl: row.officialSourceUrl,
      sourcePageTitle: row.sourcePageTitle,
      workForm: row.workForm,
    }));
  }

  extractJuries(edition: EditionRef): ExtractedJury[] {
    const entry =
      edition.year === 2026
        ? "https://www.worldphoto.org/2026-judges"
        : "https://www.worldphoto.org/sony-world-photography-awards/2025-judges";
    assertEntryUrl(entry);
    const editionId = `swpa-${edition.year}`;
    return database.juryAssignments
      .filter((assignment) => assignment.editionId === editionId)
      .map((assignment) => {
        const jury = database.juries.find((item) => item.id === assignment.juryId);
        const rawTracks = listTracks(editionId)
          .filter((track) => assignment.tracks.includes(track.normalizedTrack))
          .map((track) => track.rawName);
        return {
          name: jury?.name ?? assignment.juryId,
          year: edition.year,
          rawTracks,
          roleTitle: assignment.roleTitle,
          institution: assignment.institution,
          officialProfileUrl: assignment.officialProfileUrl,
        };
      });
  }

  extractOfficialImages(edition: EditionRef) {
    return listLibrary()
      .filter((item) => item.year === edition.year)
      .map((item) => ({
        workKey: item.id,
        officialImageUrl: null,
        rightsStatus: "rights_blocked",
      }));
  }

  collect(edition: EditionRef) {
    return collectEdition(edition.year);
  }
}

export function collectionReport() {
  const adapter = new SonyAdapter();
  const editions = adapter.discoverEditions();
  const validation = collectCompetition(editions.map((edition) => edition.year));
  return {
    adapter: adapter.id,
    network: false,
    entrypoints: [...ENTRY_ALLOWLIST],
    validation: validation.summary,
    editions: editions.map((edition) => {
      const collected = validation.editions.find((item) => item.editionYear === edition.year);
      return {
        ...edition,
        winners: adapter.extractWinners(edition).length,
        juries: adapter.extractJuries(edition).length,
        imagesHosted: 0,
        validation: collected?.summary ?? null,
      };
    }),
  };
}
