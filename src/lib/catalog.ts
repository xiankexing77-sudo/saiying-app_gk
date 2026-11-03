import seedFile from "../../data/seed.json";
import {
  buildAnalyses,
  regenerateAnalysis,
  type AnalysisContext,
  type EditionStats,
} from "@/lib/analysis/generate";
import type {
  AnalysisResult,
  Award,
  AwardType,
  Category,
  Contest,
  ContestJudge,
  EditionYear,
  Judge,
  Work,
} from "@/lib/types";
import { AWARD_TYPES } from "@/lib/types";

type SeedFile = {
  contests: Contest[];
  categories: Category[];
  judges: Judge[];
  contest_judges: ContestJudge[];
  works: Work[];
  awards: Award[];
};

const seed = seedFile as SeedFile;

const contests = seed.contests;
const categories = seed.categories;
const judges = seed.judges;
const contestJudges = seed.contest_judges;
const works = seed.works;
const awards = seed.awards;

function statsFor(year: EditionYear): EditionStats {
  const yearWorks = works.filter((work) => work.year === year);
  const byCategory = categories.map((category) => ({
    name_zh: category.name_zh,
    count: yearWorks.filter((work) => work.category_id === category.id).length,
  }));
  const byAward = AWARD_TYPES.map((awardType) => ({
    award_type: awardType,
    count: awards.filter((award) => award.year === year && award.award_type === awardType)
      .length,
  })).filter((item) => item.count > 0);
  return { year, workCount: yearWorks.length, byCategory, byAward };
}

function judgesForYear(year: EditionYear) {
  const ids = contestJudges
    .filter((link) => link.year === year)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((link) => link.judge_id);
  return ids
    .map((id) => judges.find((judge) => judge.id === id))
    .filter((judge): judge is Judge => Boolean(judge));
}

const context: AnalysisContext = {
  works,
  awards,
  categories,
  judges,
  judgesByYear: {
    2025: judgesForYear(2025),
    2026: judgesForYear(2026),
  },
  statsByYear: {
    2025: statsFor(2025),
    2026: statsFor(2026),
  },
};

const analyses = buildAnalyses(context);

export function getContests() {
  return [...contests].sort((a, b) => b.edition_year - a.edition_year);
}

export function getContest(year: number) {
  return contests.find((contest) => contest.edition_year === year) ?? null;
}

export function getCategories() {
  return categories;
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id) ?? null;
}

export function getWorks() {
  return works;
}

export function getWorksByYear(year: EditionYear) {
  return works.filter((work) => work.year === year);
}

export function getWork(id: string) {
  return works.find((work) => work.id === id) ?? null;
}

export function getAwardsForWork(workId: string) {
  const order = new Map<AwardType, number>(AWARD_TYPES.map((type, index) => [type, index]));
  return awards
    .filter((award) => award.work_id === workId)
    .sort(
      (a, b) =>
        (order.get(a.award_type) ?? 99) - (order.get(b.award_type) ?? 99),
    );
}

export function getJudges() {
  return judges;
}

export function getJudge(id: string) {
  return judges.find((judge) => judge.id === id) ?? null;
}

export function getJudgesByYear(year: EditionYear) {
  return context.judgesByYear[year];
}

export function getJudgeYears(judgeId: string): EditionYear[] {
  return contestJudges
    .filter((link) => link.judge_id === judgeId)
    .map((link) => link.year)
    .sort();
}

export function getStats(year: EditionYear) {
  return context.statsByYear[year];
}

export function getAnalyses() {
  return analyses;
}

export function getAnalysis(
  targetType: AnalysisResult["target_type"],
  targetId: string,
  kind: AnalysisResult["kind"],
) {
  return (
    analyses.find(
      (item) =>
        item.target_type === targetType &&
        item.target_id === targetId &&
        item.kind === kind,
    ) ?? null
  );
}

export function rebuildAnalysis(
  targetType: AnalysisResult["target_type"],
  targetId: string,
  kind: AnalysisResult["kind"],
) {
  return regenerateAnalysis(context, targetType, targetId, kind);
}

export function searchBlob(work: Work) {
  return [
    work.title,
    ...work.title_aliases,
    work.photographer ?? "",
    ...work.name_aliases.map((alias) => alias.name),
    work.description ?? "",
    work.phone_model ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function isEditionYear(value: string): value is `${EditionYear}` {
  return value === "2025" || value === "2026";
}
