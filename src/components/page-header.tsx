import type { ReactNode } from "react";

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
}: {
  kicker: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">{kicker}</p>
        <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">{title}</h1>
        {lede ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{lede}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function PageMain({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>;
}
