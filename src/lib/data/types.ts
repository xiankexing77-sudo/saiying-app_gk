export type NormalizedTrack = "series" | "single_image" | "student" | "youth";

export type WorkForm = "series" | "single";

export type ImageRightsStatus =
  | "rights_blocked"
  | "official_url_only"
  | "licensed"
  | "placeholder";

export type CollectionMode = "curated_seed" | "live_http";

export type Source = {
  id: string;
  url: string;
  pageTitle: string;
  fetchedAt: string;
  contentHash: string | null;
  rawContentSnapshot: string | null;
  parserVersion: string;
  extractionVersion: string;
  collectionMode: CollectionMode;
  publisher: "worldphoto.org" | "sony_press";
  notes: string | null;
};

export type Provenance = {
  sourceId: string;
  sourceUrl: string;
  sourcePageTitle: string;
  fetchedAt: string;
  contentHash: string | null;
  parserVersion: string;
  extractionVersion: string;
};

export type Competition = {
  id: string;
  name: string;
  nameZh: string;
  organizer: string;
  homepageUrl: string;
  provenance: Provenance;
};

export type Edition = {
  id: string;
  competitionId: string;
  year: number;
  editionNumber: number | null;
  officialLabel: string;
  winnersComplete: boolean;
  submissionNote: string | null;
  provenance: Provenance;
};

export type Honor = {
  id: string;
  editionId: string;
  title: string;
  recipient: string;
  summary: string;
  provenance: Provenance;
};

export type Track = {
  id: string;
  editionId: string;
  rawName: string;
  normalizedTrack: NormalizedTrack;
  normalizedLabel: string;
  mappingVersion: string;
  workForm: WorkForm;
  provenance: Provenance;
};

export type Category = {
  id: string;
  competitionId: string;
  normalizedTrack: NormalizedTrack;
  rawName: string;
  normalizedName: string;
  mappingVersion: string;
  provenance: Provenance;
};

export type EditionCategory = {
  id: string;
  editionId: string;
  categoryId: string;
  brief: string | null;
  note: string | null;
  provenance: Provenance;
};

export type Award = {
  id: string;
  editionId: string;
  normalizedTrack: NormalizedTrack;
  name: string;
  scope: "overall" | "category";
  rank: number;
  provenance: Provenance;
};

export type Photographer = {
  id: string;
  name: string;
  country: string | null;
  nameNote: string | null;
  provenance: Provenance;
};

export type ImageAsset = {
  id: string;
  officialImageUrl: string | null;
  rightsStatus: ImageRightsStatus;
  rightsNote: string;
  hostedBinary: false;
};

export type Photograph = {
  id: string;
  title: string | null;
  photographerIds: string[];
  editionId: string;
  categoryId: string;
  description: string | null;
  officialPageUrl: string;
  imageAssetId: string;
  role: "standalone" | "series_frame";
  provenance: Provenance;
};

export type Series = {
  id: string;
  editionId: string;
  photographerIds: string[];
  title: string | null;
  description: string | null;
  categoryId: string;
  officialSourceUrl: string;
  imageCount: number | null;
  imageCountNote: string;
  imageAssetId: string;
  provenance: Provenance;
  publicQuotes: PublicQuote[];
};

export type PublicQuote = {
  speaker: string;
  role: string;
  text: string;
  boundary: string;
  provenance: Provenance;
};

export type SeriesImage = {
  id: string;
  seriesId: string;
  photographId: string;
  sequenceNumber: number;
};

export type AwardLink = {
  id: string;
  awardId: string;
  seriesId: string | null;
  photographId: string | null;
  photographerIds: string[];
  provenance: Provenance;
};

export type Jury = {
  id: string;
  name: string;
  provenance: Provenance;
};

export type JuryAssignment = {
  id: string;
  juryId: string;
  editionId: string;
  tracks: NormalizedTrack[];
  roleTitle: string;
  institution: string | null;
  biographyExcerpt: string | null;
  officialProfileUrl: string;
  provenance: Provenance;
};

export type PortfolioChannel =
  | "official_jury_page"
  | "personal_site"
  | "publisher"
  | "press"
  | "museum_gallery";

export type StyleDimension = "visual_style" | "subject" | "color" | "composition" | "narrative" | "theme";

export type StyleTagScope = "cross_group" | "single_group";

/**
 * 样本组：研究对象本人署名发表的一套作品。
 * 同一套作品出现在多个页面只计 1 组。评委评论或评审的他人作品不计。
 */
export type PersonalWorkSource = {
  sourceId: string;
  url: string;
  pageTitle: string;
  channel: PortfolioChannel;
  excerpt: string;
  fetchedAt: string;
  contentHash: null;
  parserVersion: string;
  extractionVersion: string;
  collectionMode: "curated_seed";
};

export type PublishedClaim = {
  key: string;
  quote: string;
  sourceUrl: string;
};

export type SampleGroup = {
  id: string;
  subjectId: string;
  title: string;
  yearLabel: string | null;
  authorship: "own_work";
  imageCount: number | null;
  imageCountNote: string;
  rightsStatus: "rights_blocked";
  hostedBinary: false;
  officialImageUrl: null;
  sources: PersonalWorkSource[];
  claims: PublishedClaim[];
};

export type RejectedWork = {
  subjectId: string;
  title: string | null;
  url: string | null;
  channel: PortfolioChannel;
  reason: "not_own_work" | "unsafe_url" | "missing_description";
  note: string;
};

export type PortfolioChannelRun = {
  subjectId: string;
  channel: PortfolioChannel;
  url: string | null;
  outcome: "group_recorded" | "merged_into_existing_group" | "no_personal_work" | "rejected";
  note: string;
};

export type PersonalWorkAcquisition = {
  subjectId: string;
  subjectName: string;
  requiredGroups: 3;
  groups: SampleGroup[];
  rejected: RejectedWork[];
  runs: PortfolioChannelRun[];
  network: false;
  collectionMode: "curated_seed";
};

export type StyleTagEvidence = {
  sourceUrl: string;
  groupId: string;
  groupTitle: string;
  quote: string;
  rationale: string;
};

export type StyleTag = {
  id: string;
  subjectId: string;
  dimension: StyleDimension;
  label: string;
  scope: StyleTagScope;
  statement: string;
  confidence: number;
  sampleCount: number;
  groupIds: string[];
  evidence: StyleTagEvidence[];
  modelName: string;
  modelVersion: string;
};

export type JuryPortfolio = {
  id: string;
  juryId: string;
  url: string | null;
  title: string | null;
  note: string;
  channel: PortfolioChannel | null;
  groupId: string | null;
};

export type JuryFactProfile = {
  juryId: string;
  kind: "fact";
  education: string | null;
  publications: string[];
  interviews: { title: string; url: string }[];
};

export type JuryInference = {
  juryId: string;
  kind: "inference";
  sampleStatus: "insufficient" | "sufficient";
  sampleCount: number;
  confidence: number | null;
  modelName: string | null;
  modelVersion: string | null;
  analyzedAt: string | null;
  requiredGroupCount: 3;
  evidence: { sourceUrl: string; rationale: string }[];
  styleTags: StyleTag[];
  visualStyle: string | null;
  commonSubjects: string | null;
  colorTendency: string | null;
  compositionTendency: string | null;
  narrativePreference: string | null;
  thematicMode: string | null;
  statement: string;
};

export type AnalysisEvidence = {
  dimension: string;
  label: string;
  quote: string;
  sourceUrl: string | null;
  rationale: string;
};

export type TextBasis = "official_text" | "user_caption";

export type SingleImageAnalysis = {
  id: string;
  photographId: string;
  kind: "inference";
  schema: "single_image";
  status: "text_grounded" | "insufficient_text";
  basis: TextBasis;
  pixelsRead: false;
  basicDescription: null;
  subjectScene: string | null;
  composition: string | null;
  light: string | null;
  color: string | null;
  visualWeight: null;
  spatialDepth: string | null;
  mood: string | null;
  narrative: string | null;
  theme: string | null;
  uniqueness: null;
  technique: string | null;
  confidence: number | null;
  modelName: string | null;
  modelVersion: string | null;
  analyzedAt: string | null;
  evidence: AnalysisEvidence[];
  evidenceNote: string;
};

export type SeriesAnalysis = {
  id: string;
  seriesId: string;
  kind: "inference";
  schema: "series";
  status: "text_grounded" | "insufficient_text";
  basis: "official_text";
  pixelsRead: false;
  narrativeCoherence: null;
  visualUnity: string | null;
  imageRelations: string | null;
  themeDevelopment: string | null;
  pacing: null;
  completeness: null;
  confidence: number | null;
  modelName: string | null;
  modelVersion: string | null;
  analyzedAt: string | null;
  evidence: AnalysisEvidence[];
  evidenceNote: string;
};

export type ResearchScope = {
  winners: boolean;
  shortlists: boolean;
  juries: boolean;
  juryPortfolios: boolean;
  imageAnalysis: boolean;
  reportGeneration: boolean;
};

export type TaskStageLog = {
  stage: string;
  status: "passed" | "blocked" | "skipped" | "failed";
  summary: string;
};

export type AgentTask = {
  id: string;
  type: "crawl" | "research" | "analyze" | "report" | "stage_b";
  title: string;
  status: "queued" | "running" | "succeeded" | "failed" | "blocked";
  stage: string;
  total: number;
  completed: number;
  failed: number;
  currentItem: string | null;
  errorLog: string[];
  startedAt: string | null;
  finishedAt: string | null;
  idempotencyKey: string;
  years: number[];
  scope: ResearchScope | null;
  stages: TaskStageLog[];
  stageB?: {
    injectFailureWorkId: string | null;
    publicSources: {
      subjectKind: "winner" | "jury";
      subjectId: string;
      sourceUrl: string;
      pageUrl: string;
      note?: string;
    }[];
  } | null;
};

export type Database = {
  competition: Competition;
  editions: Edition[];
  honors: Honor[];
  tracks: Track[];
  categories: Category[];
  editionCategories: EditionCategory[];
  awards: Award[];
  photographers: Photographer[];
  imageAssets: ImageAsset[];
  photographs: Photograph[];
  series: Series[];
  seriesImages: SeriesImage[];
  awardLinks: AwardLink[];
  juries: Jury[];
  juryAssignments: JuryAssignment[];
  juryPortfolios: JuryPortfolio[];
  juryFacts: JuryFactProfile[];
  juryInferences: JuryInference[];
  personalWorks: PersonalWorkAcquisition[];
  singleAnalyses: SingleImageAnalysis[];
  seriesAnalyses: SeriesAnalysis[];
  tasks: AgentTask[];
  sources: Source[];
};
