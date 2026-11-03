"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "总览" },
  { href: "/competitions", label: "赛事" },
  { href: "/photographs", label: "作品" },
  { href: "/juries", label: "评委" },
  { href: "/reports", label: "报告" },
  { href: "/tasks", label: "任务" },
  { href: "/analyze", label: "分析作品" },
  { href: "/sources", label: "来源" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-[#f7f3ec]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-baseline gap-3">
            <span className="font-serif text-lg tracking-tight">Photo Jury Intelligence</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">摄影赛事评委研究</span>
          </Link>
          <p className="text-[11px] text-muted-foreground">SWPA 2025–2026</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                  active ? "bg-stone-900 text-stone-50" : "text-stone-700 hover:bg-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  return <div className="h-[92px] border-b border-border bg-[#f7f3ec]" />;
}
