import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
}: {
  kicker: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-8 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-3xl flex-col gap-4">
        <p className="font-num text-xs tracking-[0.16em] text-muted-foreground uppercase">{kicker}</p>
        <h1 className="font-title">{title}</h1>
        {lede ? <p className="text-sm leading-6 text-muted-foreground">{lede}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function PageMain({ children }: { children: ReactNode }) {
  return (
    <main data-space-unit="8" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      {children}
    </main>
  );
}
