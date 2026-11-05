import { collectionReport } from "../collectors/sony/adapter";
import { personalWorkSummary, qualityReport, textEvidenceCounts } from "../src/lib/catalog";
import { initialState, type AgentStage, type AgentState } from "./state";
import type { ResearchScope } from "../src/lib/data/types";

export const GRAPH: AgentStage[] = [
  "discovery",
  "collection",
  "normalization",
  "image_analysis",
  "jury_research",
  "aesthetic_analysis",
  "quality_check",
  "report",
];

export type NodeResult = {
  stage: AgentStage;
  status: "passed" | "blocked" | "skipped";
  summary: string;
};

const FULL_SCOPE: ResearchScope = {
  winners: true,
  shortlists: false,
  juries: true,
  juryPortfolios: true,
  imageAnalysis: true,
  reportGeneration: true,
};

/** 进程内阶段说明。采集读夹具，图片分析不读像素。不是 LangGraph 运行时。 */
export function runScopedGraph(input: { years: number[]; scope: ResearchScope }): { state: AgentState; nodes: NodeResult[] } {
  const years = [...new Set(input.years)].sort((a, b) => a - b);
  const state = initialState(years);
  const report = collectionReport();
  const quality = qualityReport();
  const text = textEvidenceCounts();
  const personal = personalWorkSummary();
  const yearNote = years.join("、");
  const editions = report.editions.filter((edition) => years.includes(edition.year));
  const agree = editions.reduce((sum, edition) => sum + (edition.validation?.agree ?? 0), 0);
  const conflict = editions.reduce((sum, edition) => sum + (edition.validation?.conflict ?? 0), 0);
  const singleSource = editions.reduce((sum, edition) => sum + (edition.validation?.singleSource ?? 0), 0);
  const winners = editions.reduce((sum, edition) => sum + edition.winners, 0);

  const nodes: NodeResult[] = [
    {
      stage: "discovery",
      status: "passed",
      summary: `入口限定为 SWPA ${yearNote}。2027 不在完整获奖集内。未访问网络。`,
    },
    input.scope.shortlists
      ? {
          stage: "collection",
          status: "blocked",
          summary: `Shortlist 不在首期核心数据里。没有抓取入围名单，也没有补写。已核对的获奖夹具仍是 ${winners} 条，一致 ${agree}，冲突 ${conflict}，单一来源 ${singleSource}。`,
        }
      : input.scope.winners
        ? {
            stage: "collection",
            status: "passed",
            summary: `多来源交叉验证（夹具，未访问网络）：获奖 ${winners} 条，一致 ${agree}，冲突 ${conflict}，单一来源 ${singleSource}。冲突保留各方原文。`,
          }
        : {
            stage: "collection",
            status: "skipped",
            summary: "本次范围不采集获奖名单。",
          },
    {
      stage: "normalization",
      status: "passed",
      summary: "保留 Professional / Open 原文，并映射到 Series / Single Image。不同赛制不并成一组。",
    },
    input.scope.imageAnalysis
      ? {
          stage: "image_analysis",
          status: "blocked",
          summary: `像素分析阻塞：作品图片均为 rights_blocked，未保存原图，也未配置视觉模型。文本证据已另行生成：${text.grounded} 条说明命中词表，${text.insufficient} 条留空。文本证据不代替看图。`,
        }
      : {
          stage: "image_analysis",
          status: "skipped",
          summary: "本次范围不要求图片分析。",
        },
    input.scope.juries || input.scope.juryPortfolios
      ? {
          stage: "jury_research",
          status: personal.ready > 0 ? "passed" : "blocked",
          summary: `${personal.ready} 位评委的本人作品达到 3 组，风格标签只来自这些作品的公开陈述。${personal.insufficient} 位样本不足，不从简介生成偏好。不把获奖作品连成个人投票。`,
        }
      : {
          stage: "jury_research",
          status: "skipped",
          summary: "本次范围不研究评委。",
        },
    {
      stage: "aesthetic_analysis",
      status: text.grounded > 0 ? "passed" : "blocked",
      summary:
        text.grounded > 0
          ? "像素趋势未生成。同赛制报告只对照官方说明里已经写到的原句，没写到的维度保持未生成。"
          : "没有可引用的说明原句，跨届审美变化留空。",
    },
    {
      stage: "quality_check",
      status: quality.ok ? "passed" : "blocked",
      summary: quality.ok ? "种子完整性检查通过。事实与推断仍分开。" : "种子完整性检查未通过。",
    },
    input.scope.reportGeneration
      ? {
          stage: "report",
          status: "passed",
          summary: "可以输出同赛制事实对照，以及有原句的说明摘录。没有像素趋势。",
        }
      : {
          stage: "report",
          status: "skipped",
          summary: "本次范围不生成报告。",
        },
  ];

  state.stage = "report";
  state.entityIds.push(...editions.map((edition) => `swpa-${edition.year}`));
  state.notes.push("本图在进程内描述阶段，不是 LangGraph 运行时。不访问网络，不保存图片二进制。交叉验证由采集器完成，Agent 不改写冲突字段。");
  return { state, nodes };
}

export function runStubGraph(years: number[]) {
  return runScopedGraph({ years, scope: FULL_SCOPE });
}
