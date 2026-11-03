import { PARSER_VERSION, SEED_FETCHED_AT } from "../../src/lib/data/sources";
import type {
  JuryPortfolio,
  PersonalWorkAcquisition,
  PersonalWorkSource,
  PublishedClaim,
  SampleGroup,
} from "../../src/lib/data/types";
import { assertPortfolioUrl } from "./allowlist";
import { REQUIRED_SAMPLE_GROUPS } from "./claims";
import { PORTFOLIO_FIXTURE, PORTFOLIO_LEADS, type FixtureCandidate, type FixtureLead } from "./fixture";

export const PERSONAL_WORK_EXTRACTION = "personal-works-fixture-1";

export type SubjectRef = {
  id: string;
  name: string;
  officialProfileUrls: string[];
};

function sourceFor(candidate: FixtureCandidate, url: string, index: number): PersonalWorkSource {
  return {
    sourceId: `src-pw-${candidate.subjectId}-${candidate.bodyKey}-${candidate.channel}-${index}`,
    url,
    pageTitle: candidate.pageTitle,
    channel: candidate.channel,
    excerpt: candidate.excerpt ?? "",
    fetchedAt: SEED_FETCHED_AT,
    contentHash: null,
    parserVersion: PARSER_VERSION,
    extractionVersion: PERSONAL_WORK_EXTRACTION,
    collectionMode: "curated_seed",
  };
}

function claimsFor(candidate: FixtureCandidate, url: string): PublishedClaim[] {
  return candidate.claims.map((claim) => ({ key: claim.key, quote: claim.quote, sourceUrl: url }));
}

/**
 * 采集器只登记本人作品和来源。它不生成风格标签。
 * 同一 bodyKey 的多个页面并成一组。没有说明、不是本人作品、或不在允许清单里的条目都不计数。
 */
export function collectCandidates(
  subject: SubjectRef,
  candidates: FixtureCandidate[],
  leads: FixtureLead[] = [],
): PersonalWorkAcquisition {
  const groups = new Map<string, SampleGroup>();
  const rejected: PersonalWorkAcquisition["rejected"] = [];
  const runs: PersonalWorkAcquisition["runs"] = [];

  for (const officialUrl of [...new Set(subject.officialProfileUrls)]) {
    try {
      const url = assertPortfolioUrl(officialUrl);
      runs.push({
        subjectId: subject.id,
        channel: "official_jury_page",
        url,
        outcome: "no_personal_work",
        note: "官方评委页记录职务和简介。页面没有给出本人作品链接，简介不转成样本组。",
      });
    } catch (error) {
      runs.push({
        subjectId: subject.id,
        channel: "official_jury_page",
        url: officialUrl,
        outcome: "rejected",
        note: error instanceof Error ? error.message : "官方评委页链接未通过安全检查",
      });
    }
  }

  for (const lead of leads.filter((item) => item.subjectId === subject.id)) {
    try {
      const url = assertPortfolioUrl(lead.url);
      runs.push({
        subjectId: subject.id,
        channel: lead.channel,
        url,
        outcome: "no_personal_work",
        note: lead.note,
      });
    } catch (error) {
      rejected.push({
        subjectId: subject.id,
        title: null,
        url: lead.url,
        channel: lead.channel,
        reason: "unsafe_url",
        note: error instanceof Error ? error.message : "链接未通过安全检查",
      });
      runs.push({
        subjectId: subject.id,
        channel: lead.channel,
        url: lead.url,
        outcome: "rejected",
        note: error instanceof Error ? error.message : "链接未通过安全检查",
      });
    }
  }

  candidates
    .filter((candidate) => candidate.subjectId === subject.id)
    .forEach((candidate, index) => {
      if (candidate.authorship !== "own_work") {
        rejected.push({
          subjectId: subject.id,
          title: candidate.title,
          url: candidate.url,
          channel: candidate.channel,
          reason: "not_own_work",
          note: "这是评委评论或评审语境下的他人作品，不是本人作品，不计入样本组。",
        });
        runs.push({
          subjectId: subject.id,
          channel: candidate.channel,
          url: candidate.url,
          outcome: "rejected",
          note: `《${candidate.title}》不是本人作品。`,
        });
        return;
      }

      let url: string;
      try {
        url = assertPortfolioUrl(candidate.url);
      } catch (error) {
        const note = error instanceof Error ? error.message : "链接未通过安全检查";
        rejected.push({
          subjectId: subject.id,
          title: candidate.title,
          url: candidate.url,
          channel: candidate.channel,
          reason: "unsafe_url",
          note,
        });
        runs.push({
          subjectId: subject.id,
          channel: candidate.channel,
          url: candidate.url,
          outcome: "rejected",
          note,
        });
        return;
      }

      if (!candidate.excerpt || candidate.excerpt.trim().length === 0) {
        rejected.push({
          subjectId: subject.id,
          title: candidate.title,
          url,
          channel: candidate.channel,
          reason: "missing_description",
          note: "页面没有可引用的作品说明。不把标题当成风格证据，也不计为样本组。",
        });
        runs.push({
          subjectId: subject.id,
          channel: candidate.channel,
          url,
          outcome: "rejected",
          note: `《${candidate.title}》没有作品说明，未计入。`,
        });
        return;
      }

      const source = sourceFor(candidate, url, index);
      const claims = claimsFor(candidate, url);
      for (const claim of claims) {
        if (!source.excerpt.includes(claim.quote)) {
          throw new Error(`摘录里没有这条原文（${candidate.bodyKey} / ${claim.key}）`);
        }
      }

      const existing = groups.get(candidate.bodyKey);
      if (existing) {
        existing.sources.push(source);
        existing.claims.push(...claims);
        runs.push({
          subjectId: subject.id,
          channel: candidate.channel,
          url,
          outcome: "merged_into_existing_group",
          note: `与《${existing.title}》是同一作品整体，不另计一组。`,
        });
        return;
      }

      groups.set(candidate.bodyKey, {
        id: `group-${subject.id}-${candidate.bodyKey}`,
        subjectId: subject.id,
        title: candidate.title,
        yearLabel: candidate.yearLabel,
        authorship: "own_work",
        imageCount: candidate.imageCount,
        imageCountNote: candidate.imageCountNote,
        rightsStatus: "rights_blocked",
        hostedBinary: false,
        officialImageUrl: null,
        sources: [source],
        claims,
      });
      runs.push({
        subjectId: subject.id,
        channel: candidate.channel,
        url,
        outcome: "group_recorded",
        note: "记为 1 组本人作品。图片权限阻塞，未保存原图。",
      });
    });

  return {
    subjectId: subject.id,
    subjectName: subject.name,
    requiredGroups: REQUIRED_SAMPLE_GROUPS,
    groups: [...groups.values()],
    rejected,
    runs,
    network: false,
    collectionMode: "curated_seed",
  };
}

export function acquirePersonalWorks(subjects: SubjectRef[]) {
  return subjects.map((subject) => collectCandidates(subject, PORTFOLIO_FIXTURE, PORTFOLIO_LEADS));
}

export function portfoliosFrom(acquisition: PersonalWorkAcquisition): JuryPortfolio[] {
  if (acquisition.groups.length === 0) {
    return [
      {
        id: `portfolio-${acquisition.subjectId}-none`,
        juryId: acquisition.subjectId,
        url: null,
        title: null,
        note: "已知公开入口没有可计入的本人作品组。没有样本组，就不能填写视觉风格。",
        channel: null,
        groupId: null,
      },
    ];
  }
  return acquisition.groups.map((group) => ({
    id: `portfolio-${group.id}`,
    juryId: acquisition.subjectId,
    url: group.sources[0]?.url ?? null,
    title: group.title,
    note: `本人作品样本组，${group.sources.length} 条来源。图片权限阻塞，未保存原图。`,
    channel: group.sources[0]?.channel ?? null,
    groupId: group.id,
  }));
}
