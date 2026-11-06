import { database } from "../data/seed";

export type JuryPublicField = {
  key: "name" | "roleTitle" | "institution" | "biographyExcerpt";
  value: string;
  sourceUrl: string;
  quote: string;
};

export type JuryPublicProfile = {
  juryId: string;
  name: string;
  editionYear: number;
  panel: "official_judges_page";
  round: null;
  roundNote: string;
  chair: boolean;
  officialProfileUrl: string;
  sourceUrl: string;
  fields: JuryPublicField[];
  education: null;
  publications: [];
  interviews: [];
  uncollected: ["education", "publications", "interviews"];
};

const ROUND_NOTE = "官方评委页没有写初轮或终轮。职务原文照录，不把 Chair 改写成终轮，也不补写履历。";

export function listJuryPublicProfiles(year?: number): JuryPublicProfile[] {
  return database.juryAssignments
    .filter((assignment) => year === undefined || assignment.editionId === `swpa-${year}`)
    .map((assignment) => {
      const jury = database.juries.find((item) => item.id === assignment.juryId);
      const edition = database.editions.find((item) => item.id === assignment.editionId);
      const sourceUrl = assignment.provenance.sourceUrl;
      const fields: JuryPublicField[] = [];
      if (jury?.name) {
        fields.push({ key: "name", value: jury.name, sourceUrl: jury.provenance.sourceUrl, quote: jury.name });
      }
      if (assignment.roleTitle) {
        fields.push({ key: "roleTitle", value: assignment.roleTitle, sourceUrl, quote: assignment.roleTitle });
      }
      if (assignment.institution) {
        fields.push({ key: "institution", value: assignment.institution, sourceUrl, quote: assignment.institution });
      }
      if (assignment.biographyExcerpt) {
        fields.push({
          key: "biographyExcerpt",
          value: assignment.biographyExcerpt,
          sourceUrl,
          quote: assignment.biographyExcerpt,
        });
      }
      return {
        juryId: assignment.juryId,
        name: jury?.name ?? assignment.juryId,
        editionYear: edition?.year ?? 0,
        panel: "official_judges_page" as const,
        round: null,
        roundNote: ROUND_NOTE,
        chair: /chair of the jury/i.test(assignment.roleTitle),
        officialProfileUrl: assignment.officialProfileUrl,
        sourceUrl,
        fields,
        education: null,
        publications: [] as [],
        interviews: [] as [],
        uncollected: ["education", "publications", "interviews"] as ["education", "publications", "interviews"],
      };
    })
    .sort((left, right) => left.editionYear - right.editionYear || left.name.localeCompare(right.name));
}
