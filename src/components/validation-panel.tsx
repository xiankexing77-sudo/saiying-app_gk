import Link from "next/link";
import { collectEdition, FIELD_LABEL, roleLabel, type EditionCollection, type FieldValidation } from "@/lib/collection";

function displayValue(field: FieldValidation["field"], value: string | null) {
  if (value == null && field === "winner.image_url") return "无（不保存原图）";
  if (value == null) return "空";
  if (field === "winner.rights" && value === "rights_blocked") return "rights_blocked";
  return value;
}

function VerdictMark({ field }: { field: FieldValidation }) {
  const label =
    field.verdict === "agree"
      ? `一致 · ${field.confidenceLabel}${field.confidence == null ? "" : ` ${field.confidence}`}`
      : field.verdict === "conflict"
        ? "冲突"
        : "单一来源";
  const tone =
    field.verdict === "agree"
      ? "border-teal-900/20 bg-teal-900/10 text-teal-950"
      : field.verdict === "conflict"
        ? "border-amber-900/30 bg-amber-200/80 text-amber-950"
        : "border-stone-300 bg-white text-stone-600";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>;
}

function FieldList({ fields }: { fields: FieldValidation[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {fields.map((field) => (
        <li key={`${field.entityKey}:${field.field}`} className="rounded-xl border border-border bg-white/70 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictMark field={field} />
            <span className="text-sm font-medium">{FIELD_LABEL[field.field]}</span>
          </div>
          <p className="mt-2 text-sm">{field.entityLabel}</p>
          <p className="mt-1 text-sm">
            展示值：{displayValue(field.field, field.preferredValue)}
            <span className="text-stone-500"> · {roleLabel(field.preferredRole)}</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-stone-600">{field.preferredReason}</p>
          <ul className="mt-2 space-y-2">
            {field.observations.map((observation) => (
              <li key={observation.sourceId + (observation.value ?? "")} className="text-xs leading-5 text-stone-600">
                <span className={observation.agreesWithPreferred ? "text-teal-950" : "text-amber-950"}>
                  {observation.agreesWithPreferred ? "相同" : "不同"}
                </span>
                {" · "}
                {roleLabel(observation.role)} · {displayValue(field.field, observation.value)}
                <a className="mt-0.5 block break-all text-teal-900 underline" href={observation.sourceUrl}>
                  {observation.sourcePageTitle}
                </a>
                <span className="block">
                  {observation.fetchedAt} · {observation.parserVersion} · {observation.extractionVersion}
                  {observation.contentHash ? ` · ${observation.contentHash}` : " · 未保存原文哈希"}
                </span>
                {observation.note ? <span className="block">{observation.note}</span> : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function ValidationPanel({
  report,
  fields,
  heading = "多来源采集与交叉验证",
  limitAgrees = false,
}: {
  report: EditionCollection;
  fields?: FieldValidation[];
  heading?: string;
  limitAgrees?: boolean;
}) {
  const shown = fields ?? report.fields;
  const conflicts = shown.filter((field) => field.verdict === "conflict");
  const agrees = shown.filter((field) => field.verdict === "agree");
  const singles = shown.filter((field) => field.verdict === "single_source");
  const visibleAgrees = limitAgrees ? agrees.slice(0, 6) : agrees;
  const scopedCounts = new Map<string, number>();
  for (const field of shown) {
    for (const observation of field.observations) {
      scopedCounts.set(observation.sourceId, (scopedCounts.get(observation.sourceId) ?? 0) + 1);
    }
  }
  const sources = (fields ? report.sources.filter((source) => scopedCounts.has(source.id)) : report.sources).map((source) => ({
    ...source,
    observationCount: fields ? (scopedCounts.get(source.id) ?? 0) : source.observationCount,
  }));
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">{heading}</h2>
        <p className="text-xs text-stone-500">
          {report.collectionMode} · {report.validatorVersion} · 未访问网络
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        采集器按来源分别抽出事实。重叠字段标成一致或冲突。冲突同时保留各方原文，展示值只是按官方主入口、主办方相关页、合作方新闻稿的顺序挑选，不改写其他来源。
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-teal-900/20 bg-teal-900/10 px-2 py-0.5 text-teal-950">一致 {agrees.length}</span>
        <span className="rounded-full border border-amber-900/30 bg-amber-200/80 px-2 py-0.5 text-amber-950">冲突 {conflicts.length}</span>
        <span className="rounded-full border border-stone-300 bg-white px-2 py-0.5 text-stone-600">单一来源 {singles.length}</span>
        <span className="rounded-full border border-stone-300 px-2 py-0.5 text-stone-600">{sources.length} 个来源</span>
      </div>
      <ul className="mt-3 space-y-1 text-xs leading-5 text-stone-600">
        {sources.map((source) => (
          <li key={source.id}>
            {roleLabel(source.role)} · {source.observationCount} 条 ·{" "}
            <a className="break-all text-teal-900 underline" href={source.url}>
              {source.pageTitle}
            </a>
          </li>
        ))}
      </ul>
      {conflicts.length ? (
        <>
          <h3 className="mt-5 text-lg">冲突</h3>
          <FieldList fields={conflicts} />
        </>
      ) : null}
      {visibleAgrees.length ? (
        <>
          <h3 className="mt-5 text-lg">
            一致
            {limitAgrees && agrees.length > visibleAgrees.length ? `（显示 ${visibleAgrees.length} / ${agrees.length}）` : ""}
          </h3>
          {limitAgrees ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {visibleAgrees.map((field) => (
                <li key={`${field.entityKey}:${field.field}`} className="py-2">
                  <span className="text-teal-950">一致 · {field.confidenceLabel}</span>
                  <span className="mx-2">{FIELD_LABEL[field.field]}</span>
                  <span>{displayValue(field.field, field.preferredValue)}</span>
                  <p className="text-xs text-stone-500">
                    {field.entityLabel} · {field.observations.length} 个来源一致 · 展示原文来自{roleLabel(field.preferredRole)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <FieldList fields={visibleAgrees} />
          )}
        </>
      ) : null}
      {singles.length ? (
        <p className="mt-4 text-xs leading-5 text-stone-600">
          另有 {singles.length} 个字段只有一个来源，保持单一来源，不升成已验证。
          {fields ? "下面列出本条记录的单一来源字段。" : "完整列表在校验接口里。"}
        </p>
      ) : null}
      {fields && singles.length ? <FieldList fields={singles} /> : null}
      <p className="mt-4 text-xs">
        <Link className="underline" href={`/api/v1/editions/${report.editionId}/validation`}>
          查看本届完整校验 JSON
        </Link>
      </p>
    </section>
  );
}

export function WorkValidation({ workId, year }: { workId: string; year: number }) {
  const report = collectEdition(year);
  const fields = report.fields.filter((field) => field.workId === workId);
  if (!fields.length) return null;
  return <ValidationPanel report={report} fields={fields} heading="这条记录的交叉验证" />;
}

export function JuryValidation({ juryId }: { juryId: string }) {
  const sections = [2025, 2026]
    .map((year) => {
      const report = collectEdition(year);
      return { report, fields: report.fields.filter((field) => field.juryId === juryId) };
    })
    .filter((section) => section.fields.length > 0);
  if (!sections.length) return null;
  return (
    <>
      {sections.map((section) => (
        <ValidationPanel
          key={section.report.editionId}
          report={section.report}
          fields={section.fields}
          heading={`${section.report.editionYear} 评委交叉验证`}
        />
      ))}
    </>
  );
}
