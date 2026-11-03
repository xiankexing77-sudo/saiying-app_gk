export {
  collectCompetition,
  collectEdition,
  collectEditionById,
} from "../../collectors/multi-source";
export { roleLabel } from "../../collectors/source-role";
export type {
  EditionCollection,
  FieldValidation,
  FieldVerdict,
  SourceRole,
} from "../../collectors/types";

export const FIELD_LABEL = {
  "edition.year": "届次年份",
  "edition.label": "届次名称",
  "winner.title": "作品名称",
  "winner.photographer": "摄影师",
  "winner.category": "官方组别",
  "winner.award": "奖项",
  "winner.image_url": "抽取到的图片 URL",
  "winner.rights": "图片权限",
  "jury.name": "评委姓名",
  "jury.role": "评委职务",
} as const;
