export const AWARD_TYPES = [
  "年度最佳",
  "类别第一名",
  "类别优胜",
  "组委会特别推荐奖",
  "X 系列最佳",
  "S/V 系列最佳",
  "蔡司专业风格奖",
  "学生摄影师奖",
] as const;

export const CATEGORY_CODES = [
  "Landscape",
  "Portrait",
  "Night",
  "Motion",
  "TelephotoMacro",
  "PhotoSeries",
] as const;

export type AwardType = (typeof AWARD_TYPES)[number];
export type CategoryCode = (typeof CATEGORY_CODES)[number];
export type EditionYear = 2025 | 2026;

export type Contest = {
  id: string;
  name: string;
  brand: string;
  edition_year: EditionYear;
  source_url: string;
  status_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  contest_id: string | null;
  code: CategoryCode;
  name_zh: string;
  name_en: string;
  gallery_name_zh: string;
};

export type Judge = {
  id: string;
  name: string;
  role: string;
  bio_official: string;
  style_tags_inferred: string[];
  source_url: string;
  locale_note: string;
  zeiss_path: boolean;
  created_at: string;
  updated_at: string;
};

export type ContestJudge = {
  contest_id: string;
  judge_id: string;
  year: EditionYear;
  sort_order: number;
};

export type NameAlias = {
  name: string;
  source: string;
  source_url: string;
};

export type OfficialComment = {
  speaker: string | null;
  text: string;
  source_label: string;
  source_url: string;
};

export type PublicNote = {
  label: string;
  text: string;
  source_url: string;
};

export type Work = {
  id: string;
  contest_id: string;
  title: string;
  photographer: string | null;
  photographer_source: string | null;
  name_aliases: NameAlias[];
  title_aliases: string[];
  category_id: string;
  phone_model: string | null;
  phone_note: string | null;
  like_count: number | null;
  share_count: number | null;
  detail_path: string;
  detail_url: string;
  work_id_ext: string;
  description: string | null;
  is_award_winning: boolean;
  is_excellent: boolean;
  year: EditionYear;
  official_comments: OfficialComment[];
  public_notes: PublicNote[];
  gallery_unit_name: string;
  created_at: string;
  updated_at: string;
};

export type Award = {
  id: string;
  work_id: string;
  award_type: AwardType;
  year: EditionYear;
  rank_hint: string | null;
  official_name_zh: string;
  official_name_en: string;
};

export type EvidenceSource = {
  type: "work_field" | "judge_bio" | "rule_dimension" | "edition_distribution";
  keys?: string[];
  judge_ids?: string[];
  source_url?: string;
  dims?: string[];
  year?: EditionYear;
};

export type EvidenceJson = {
  sources: EvidenceSource[];
  disclaimer: string;
  points?: string[];
  exercises?: string[];
  zeiss_path?: boolean;
  official_column?: string;
  inferred_column?: string;
  tags?: string[];
};

export type AnalysisKind = "style" | "selection_reason" | "edition_overview";
export type AnalysisTarget = "judge" | "work" | "edition";
export type AnalysisStatus = "pending" | "ready" | "failed";

export type AnalysisResult = {
  id: string;
  target_type: AnalysisTarget;
  target_id: string;
  kind: AnalysisKind;
  summary: string;
  evidence_json: EvidenceJson;
  model_meta: {
    engine: string;
    prompt_version: string;
    note: string;
    regenerated?: boolean;
  };
  status: AnalysisStatus;
  created_at: string;
};

export type Favorite = {
  id: string;
  user_id: string;
  target_type: "work" | "judge";
  target_id: string;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  target_type: "work" | "judge";
  target_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type ScreenshotRef = {
  id: string;
  target_type: "work" | "judge" | "page";
  target_id: string;
  source_url: string;
  local_ref: string;
  captured_at: string;
  user_id: string | null;
};

export const PROMPT_VERSION = "saiying-v1.0.0";
export const ANALYSIS_ENGINE = "saiying-local-template";
export const DISCLAIMER = "学习向推断，非官方评语，也不是评选结果。";
export const MISSING = "来源页暂无";
export const SNAPSHOT_AT = "2026-11-03T00:00:00.000Z";
