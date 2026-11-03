export type SourceRole = "official_primary" | "official_related" | "organizer_mirror";

export type FactField =
  | "edition.year"
  | "edition.label"
  | "winner.title"
  | "winner.photographer"
  | "winner.category"
  | "winner.award"
  | "winner.image_url"
  | "winner.rights"
  | "jury.name"
  | "jury.role";

export type FieldVerdict = "agree" | "conflict" | "single_source";

export type RawObservation = {
  editionYear: number;
  entityKey: string;
  entityLabel: string;
  field: FactField;
  value: string | null;
  sourceId: string;
  workId?: string;
  juryId?: string;
  note?: string;
};

export type SourceObservation = RawObservation & {
  sourceUrl: string;
  sourcePageTitle: string;
  fetchedAt: string;
  contentHash: string | null;
  parserVersion: string;
  extractionVersion: string;
  publisher: "worldphoto.org" | "sony_press";
  role: SourceRole;
};

export type ValidationObservation = {
  sourceId: string;
  sourceUrl: string;
  sourcePageTitle: string;
  fetchedAt: string;
  contentHash: string | null;
  parserVersion: string;
  extractionVersion: string;
  publisher: SourceObservation["publisher"];
  role: SourceRole;
  value: string | null;
  agreesWithPreferred: boolean;
  note: string | null;
};

export type FieldValidation = {
  editionYear: number;
  entityKey: string;
  entityLabel: string;
  field: FactField;
  workId: string | null;
  juryId: string | null;
  verdict: FieldVerdict;
  preferredValue: string | null;
  preferredSourceId: string;
  preferredSourceUrl: string;
  preferredSourceTitle: string;
  preferredRole: SourceRole;
  preferredReason: string;
  confidence: number | null;
  confidenceLabel: "高" | "中" | "低" | "冲突";
  observations: ValidationObservation[];
};

export type CollectionSource = {
  id: string;
  url: string;
  pageTitle: string;
  role: SourceRole;
  publisher: SourceObservation["publisher"];
  observationCount: number;
};

export type ValidationSummary = {
  agree: number;
  conflict: number;
  singleSource: number;
  sources: number;
  observations: number;
};

export type FetchPolicy = {
  network: false;
  robots: "not_contacted";
  loginBypass: false;
  storesImageBinaries: false;
  ssrfChecked: true;
};

export type EditionCollection = {
  editionId: string;
  editionYear: number;
  collectionMode: "fixture_multi_source";
  validatorVersion: "cross-validate-1";
  network: false;
  fetchPolicy: FetchPolicy;
  sources: CollectionSource[];
  observations: SourceObservation[];
  fields: FieldValidation[];
  summary: ValidationSummary;
};
