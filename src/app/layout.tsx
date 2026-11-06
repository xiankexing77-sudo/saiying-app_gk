import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import { PreferencesProvider } from "@/components/preferences";
import { preferenceBootScript } from "@/lib/design/boot";
import type { ThemeName } from "@/lib/design/tokens";
import type { Locale } from "@/lib/i18n/messages";
import "./globals.css";

const geist = localFont({
  src: [
    { path: "../fonts/Geist-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Geist-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Geist-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-geist",
  display: "swap",
  adjustFontFallback: false,
});

const departure = localFont({
  src: "../fonts/DepartureMono-Regular.woff2",
  variable: "--font-departure",
  weight: "400",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: "Photo Jury Intelligence",
    template: "%s · Photo Jury Intelligence",
  },
  description: "摄影赛事评委研究与 AI 视觉分析平台。首期试点为 Sony World Photography Awards 2025 与 2026。事实与推断分开呈现。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="zh-CN"
      data-theme="night"
      data-locale="zh"
      data-grid="off"
      className={`${geist.variable} ${departure.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: preferenceBootScript() }} />
        <Suspense fallback={<SiteHeaderFallback />}>
          <DynamicShell>{children}</DynamicShell>
        </Suspense>
      </body>
    </html>
  );
}

async function DynamicShell({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const locale: Locale = jar.get("pji-locale")?.value === "en" ? "en" : "zh";
  const theme: ThemeName = jar.get("pji-theme")?.value === "day" ? "day" : "night";
  return (
    <PreferencesProvider initialLocale={locale} initialTheme={theme}>
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </PreferencesProvider>
  );
}
