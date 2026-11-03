export type DedupeInput = {
  officialSourceUrl: string;
  officialImageUrl: string | null;
  photographerNames: string[];
  year: number;
  rawCategory: string;
  awardNames: string[];
  title: string | null;
};

export function dedupeKey(record: DedupeInput) {
  return [
    record.year,
    record.rawCategory,
    record.title ?? "",
    [...record.photographerNames].sort().join("+"),
    [...record.awardNames].sort().join("+"),
    record.officialSourceUrl,
    record.officialImageUrl ?? "",
  ].join("||");
}

export function dedupeRecords<T extends DedupeInput>(records: T[]) {
  const seen = new Set<string>();
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const record of records) {
    const key = dedupeKey(record);
    if (seen.has(key)) {
      dropped.push(record);
      continue;
    }
    seen.add(key);
    kept.push(record);
  }
  return { kept, dropped };
}
