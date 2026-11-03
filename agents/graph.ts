import { collectionReport } from "../collectors/sony/adapter";
import { qualityReport } from "../src/lib/catalog";
import { initialState, type AgentStage, type AgentState } from "./state";

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
  status: "stub" | "passed" | "blocked";
  summary: string;
};

/** 编排骨架。图片分析与评委研究在完整版中并行；这里只描述阶段，不调用模型。 */
export function runStubGraph(years: number[]): { state: AgentState; nodes: NodeResult[] } {
  const state = initialState(years);
  const report = collectionReport();
  const quality = qualityReport();
  const nodes: NodeResult[] = [
    {
      stage: "discovery",
      status: "stub",
      summary: `入口限定为 SWPA ${years.join("、")}。2027 不在完整获奖集内。`,
    },
    {
      stage: "collection",
      status: "passed",
      summary: `多来源交叉验证（夹具，未访问网络）：一致 ${report.validation.agree}，冲突 ${report.validation.conflict}，单一来源 ${report.validation.singleSource}。冲突保留各方原文。`,
    },
    {
      stage: "normalization",
      status: "stub",
      summary: "保留 Professional / Open 原文，并映射到 Series / Single Image。",
    },
    {
      stage: "image_analysis",
      status: "blocked",
      summary: "视觉模型未配置，原图未保存。",
    },
    {
      stage: "jury_research",
      status: "blocked",
      summary: "公开作品样本不足，不生成审美偏好。",
    },
    {
      stage: "aesthetic_analysis",
      status: "blocked",
      summary: "没有可比较的视觉分析结果，跨届审美变化留空。",
    },
    {
      stage: "quality_check",
      status: quality.ok ? "passed" : "blocked",
      summary: quality.ok ? "种子完整性检查通过。" : "种子完整性检查未通过。",
    },
    {
      stage: "report",
      status: "stub",
      summary: "可以输出同赛制事实对照。推断章节标记为未生成。",
    },
  ];
  state.stage = "report";
  state.entityIds.push(...report.editions.map((edition) => `swpa-${edition.year}`));
  state.notes.push("本图是桩，不是 LangGraph 运行时。交叉验证由采集器完成，Agent 不改写冲突字段。");
  state.notes.push("State 不保存图片二进制，也不保存来源原文。");
  return { state, nodes };
}
