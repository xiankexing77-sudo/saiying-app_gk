export function FactMark({ children = "事实" }: { children?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-teal-900/20 bg-teal-900/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-teal-950">
      {children}
    </span>
  );
}

export function InferenceMark({ children = "推断" }: { children?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-900/30 bg-amber-200/80 px-2 py-0.5 text-[11px] font-medium tracking-wide text-amber-950">
      {children}
    </span>
  );
}

export function RightsMark() {
  return (
    <span className="inline-flex items-center rounded-full border border-stone-400 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700">
      权限阻塞
    </span>
  );
}

export function SeedMark() {
  return (
    <span className="inline-flex items-center rounded-full border border-stone-400 bg-white/70 px-2 py-0.5 text-[11px] font-medium text-stone-600">
      种子 · 非实时抓取
    </span>
  );
}
