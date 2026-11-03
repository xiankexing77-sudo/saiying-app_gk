export type AgentStage =
  | "discovery"
  | "collection"
  | "normalization"
  | "image_analysis"
  | "jury_research"
  | "aesthetic_analysis"
  | "quality_check"
  | "report";

export type AgentState = {
  competitionId: string;
  years: number[];
  stage: AgentStage;
  entityIds: string[];
  notes: string[];
};

export function initialState(years: number[]): AgentState {
  return {
    competitionId: "swpa",
    years,
    stage: "discovery",
    entityIds: [],
    notes: ["State 只保存实体 ID 与阶段，不保存图像二进制。"],
  };
}
