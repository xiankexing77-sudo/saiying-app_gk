import type { CompetitionAdapter } from "./base";
import { SonyAdapter } from "./sony/adapter";

const adapters = new Map<string, CompetitionAdapter>([["swpa", new SonyAdapter()]]);

export function getAdapter(competitionId: string) {
  return adapters.get(competitionId) ?? null;
}

export function listAdapters() {
  return [...adapters.values()].map((adapter) => adapter.id);
}
