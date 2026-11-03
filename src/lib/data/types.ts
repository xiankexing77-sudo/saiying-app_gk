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

export type JuryPortfolio = {
  id: string;
  juryId: string;
  url: string | null;
  title: string | null;
  note: string;
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
  evidence: { sourceUrl: string; rationale: string }[];
  visualStyle: string | null;
  commonSubjects: string | null;
  colorTendency: string | null;
  compositionTendency: string | null;
  narrativePreference: string | null;
  thematicMode: string | null;
  statement: string;
};

export type SingleImageAnalysis = {
  id: string;
  photographId: string;
  kind: "inference";
  schema: "single_image";
  status: "template_unconfigured";
  basicDescription: null;
  subjectScene: null;
  composition: null;
  light: null;
  color: null;
  visualWeight: null;
  spatialDepth: null;
  mood: null;
  narrative: null;
  theme: null;
  uniqueness: null;
  technique: null;
  confidence: null;
  modelName: null;
  modelVersion: null;
  analyzedAt: null;
  evidenceNote: string;
};

export type SeriesAnalysis = {
  id: string;
  seriesId: string;
  kind: "inference";
  schema: "series";
  status: "template_unconfigured";
  narrativeCoherence: null;
  visualUnity: null;
  imageRelations: null;
  themeDevelopment: null;
  pacing: null;
  completeness: null;
  confidence: null;
  modelName: null;
  modelVersion: null;
  analyzedAt: null;
  evidenceNote: string;
};

export type AgentTask = {
  id: string;
  type: "crawl" | "research" | "analyze" | "report";
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
  singleAnalyses: SingleImageAnalysis[];
  seriesAnalyses: SeriesAnalysis[];
  tasks: AgentTask[];
  sources: Source[];
};
