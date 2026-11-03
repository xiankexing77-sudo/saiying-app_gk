import { FactMark, InferenceMark, RightsMark, SeedMark } from "@/components/marks";
import { ProvenanceLine } from "@/components/provenance";
import type {
  JuryInference,
  PersonalWorkAcquisition,
  PortfolioChannel,
  StyleDimension,
  StyleTag,
} from "@/lib/data/types";

const CHANNEL_ZH: Record<PortfolioChannel, string> = {
  official_jury_page: "官方评委页",
  personal_site: "个人网站",
  publisher: "出版社",
  press: "报道",
  museum_gallery: "机构展览页",
};

const DIMENSION_ZH: Record<StyleDimension, string> = {
  visual_style: "视觉做法",
  subject: "题材",
  color: "色彩",
  composition: "构图",
  narrative: "叙事",
  theme: "主题",
};

const REASON_ZH = {
  not_own_work: "不是本人作品",
  unsafe_url: "链接未通过公开采集检查",
  missing_description: "没有作品说明",
} as const;

export function PersonalWorksPanel({
  works,
  inference,
}: {
  works: PersonalWorkAcquisition;
  inference: JuryInference | null;
}) {
  const count = works.groups.length;
  const enough = count >= works.requiredGroups;
  const cross = inference?.styleTags.filter((tag) => tag.scope === "cross_group") ?? [];
  const single = inference?.styleTags.filter((tag) => tag.scope === "single_group") ?? [];
  return (
    <section className="mt-8 rounded-2xl border border-teal-900/15 bg-white/75 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <FactMark>本人作品</FactMark>
        <SeedMark />
        <RightsMark />
      </div>
      <h2 className="mt-3 text-2xl">样本组 {count}/{works.requiredGroups}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        一组指本人单独发表的一套作品。同一套作品被个人网站、出版社或展览页同时提到，只算 1 组。评委评论过的获奖作品不算。满 {works.requiredGroups} 组才生成风格标签。当前是夹具摘录，不访问网络，也不保存原图。
      </p>
      {enough ? (
        <p className="mt-3 rounded-xl bg-teal-900/10 px-3 py-2 text-sm text-teal-950">已达到 {works.requiredGroups} 组。风格标签写在右侧推断栏。</p>
      ) : (
        <p className="mt-3 rounded-xl bg-amber-200/70 px-3 py-2 text-sm">样本不足。已知入口用完后仍少于 {works.requiredGroups} 组，不生成风格标签。</p>
      )}
      <ul className="mt-4 space-y-4">
        {works.groups.map((group) => (
          <li key={group.id} className="rounded-xl border border-border bg-stone-50 p-3">
            <p className="text-lg">{group.title}</p>
            <p className="mt-1 text-xs text-stone-500">
              {group.yearLabel ?? "年份未单列"} · {group.sources.map((source) => CHANNEL_ZH[source.channel]).join("、")} ·{" "}
              {group.imageCount === null ? group.imageCountNote : `${group.imageCount} 件`}
            </p>
            {group.sources.map((source) => (
              <div key={source.sourceId}>
                <p className="mt-3 text-sm leading-6">{source.excerpt}</p>
                <ProvenanceLine
                  provenance={{
                    sourceId: source.sourceId,
                    sourceUrl: source.url,
                    sourcePageTitle: source.pageTitle,
                    fetchedAt: source.fetchedAt,
                    contentHash: source.contentHash,
                    parserVersion: source.parserVersion,
                    extractionVersion: source.extractionVersion,
                  }}
                />
              </div>
            ))}
          </li>
        ))}
      </ul>
      {works.rejected.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-medium">未计入</h3>
          <ul className="mt-2 space-y-2 text-sm text-stone-600">
            {works.rejected.map((item) => (
              <li key={`${item.reason}-${item.url}-${item.title}`}>
                {REASON_ZH[item.reason]}
                {item.title ? ` · 《${item.title}》` : ""} · {item.note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <h3 className="mt-4 text-sm font-medium">查过的入口</h3>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-stone-600">
        {works.runs.map((run, index) => (
          <li key={`${run.channel}-${run.url}-${index}`}>
            {CHANNEL_ZH[run.channel]} · {run.note}
          </li>
        ))}
      </ul>
      {cross.length + single.length > 0 ? <TagList cross={cross} single={single} /> : null}
    </section>
  );
}

function TagList({ cross, single }: { cross: StyleTag[]; single: StyleTag[] }) {
  return (
    <div className="mt-6 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <InferenceMark />
        <h3 className="text-lg">风格标签</h3>
      </div>
      <TagGroup title="跨组标签" tags={cross} />
      <TagGroup title="单组观察，不作为个人偏好" tags={single} />
    </div>
  );
}

function TagGroup({ title, tags }: { title: string; tags: StyleTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-xs text-stone-500">{title}</p>
      <ul className="mt-2 space-y-3">
        {tags.map((tag) => (
          <li key={tag.id} className="rounded-xl border border-amber-900/20 bg-amber-50/80 p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium">
                {DIMENSION_ZH[tag.dimension]} · {tag.label}
              </p>
              <p className="text-xs text-amber-950">
                置信度 {tag.confidence} · 样本 {tag.sampleCount} 组 · {tag.modelName} {tag.modelVersion}
              </p>
            </div>
            <p className="mt-1 text-sm leading-6">{tag.statement}</p>
            <ul className="mt-2 space-y-2">
              {tag.evidence.map((item) => (
                <li key={`${tag.id}-${item.sourceUrl}-${item.quote}`} className="text-xs leading-5 text-stone-600">
                  <FactMark>陈述</FactMark> 《{item.groupTitle}》「{item.quote}」{" "}
                  <a className="break-all underline" href={item.sourceUrl}>
                    {item.sourceUrl}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
