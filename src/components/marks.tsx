"use client";

import type { ReactNode } from "react";
import { useI18n } from "./preferences";

export function FactMark({ children }: { children?: ReactNode }) {
  const { m } = useI18n();
  return <span className="mark mark-fact">{children ?? m.marks.fact}</span>;
}

export function InferenceMark({ children }: { children?: ReactNode }) {
  const { m } = useI18n();
  return <span className="mark mark-inference">{children ?? m.marks.inference}</span>;
}

export function RightsMark() {
  const { m } = useI18n();
  return <span className="mark mark-rights">{m.marks.rights}</span>;
}

export function SeedMark() {
  const { m } = useI18n();
  return <span className="mark mark-seed">{m.marks.seed}</span>;
}
