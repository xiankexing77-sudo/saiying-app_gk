"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const links = [
  { href: "/contests/2026", label: "2026" },
  { href: "/contests/2025", label: "2025" },
  { href: "/judges", label: "评委" },
  { href: "/me", label: "我的" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-wide">赛影</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            VISION+ 学习档案
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground",
                  active && "bg-primary/10 text-foreground",
                )}
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
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="font-serif text-xl">赛影</span>
      </div>
    </header>
  );
}
