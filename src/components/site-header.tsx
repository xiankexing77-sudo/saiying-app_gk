"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Aperture, Images, LayoutDashboard, Library, ListTodo, ScrollText, ScanLine, Trophy, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LinearIcon } from "./linear-icon";
import { useI18n } from "./preferences";
import { ShellControls } from "./shell-controls";

const links: { href: string; key: "home" | "competitions" | "works" | "juries" | "reports" | "tasks" | "analyze" | "sources"; icon: LucideIcon }[] = [
  { href: "/", key: "home", icon: LayoutDashboard },
  { href: "/competitions", key: "competitions", icon: Trophy },
  { href: "/photographs", key: "works", icon: Images },
  { href: "/juries", key: "juries", icon: Users },
  { href: "/reports", key: "reports", icon: ScrollText },
  { href: "/tasks", key: "tasks", icon: ListTodo },
  { href: "/analyze", key: "analyze", icon: ScanLine },
  { href: "/sources", key: "sources", icon: Library },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { m } = useI18n();
  return (
    <header className="shell-bar">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 sm:px-8">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <LinearIcon icon={Aperture} />
            <span className="text-base font-medium tracking-tight">{m.brand.name}</span>
            <span className="hidden text-xs text-muted-foreground lg:inline">{m.brand.tagline}</span>
          </Link>
          <div className="flex items-center gap-4">
            <p className="font-num hidden text-xs text-muted-foreground sm:block">{m.brand.range}</p>
            <ShellControls />
          </div>
        </div>
        <nav className="flex h-8 items-center gap-2 overflow-x-auto">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={active ? "nav-chip nav-chip-active" : "nav-chip"}>
                <LinearIcon icon={link.icon} />
                {m.nav[link.key]}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  return <div className="shell-bar h-24" />;
}
