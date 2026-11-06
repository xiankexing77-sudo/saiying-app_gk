"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  DEFAULT_THEME,
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  paletteFor,
  paletteStorageKey,
  sanitizePalette,
  type Palette,
  type ThemeName,
} from "@/lib/design/tokens";
import { DEFAULT_LOCALE, messages, translate, type Locale, type Messages } from "@/lib/i18n/messages";

const PREFS_EVENT = "pji-prefs";

type Snapshot = {
  theme: ThemeName;
  locale: Locale;
  palette: Palette;
  grid: boolean;
  key: string;
};

const serverSnapshot: Snapshot = {
  theme: DEFAULT_THEME,
  locale: DEFAULT_LOCALE,
  palette: paletteFor(DEFAULT_THEME),
  grid: false,
  key: "server",
};

let clientSnapshot: Snapshot = serverSnapshot;
let prefsReady = false;
const serverSnapCache = new Map<string, Snapshot>();

export function cachedServerSnapshot(theme: ThemeName, locale: Locale): Snapshot {
  const key = `ssr|${theme}|${locale}`;
  const existing = serverSnapCache.get(key);
  if (existing) return existing;
  const snapshot: Snapshot = { theme, locale, palette: paletteFor(theme), grid: false, key };
  serverSnapCache.set(key, snapshot);
  return snapshot;
}

function readStoredPalette(theme: ThemeName): Palette {
  try {
    const raw = localStorage.getItem(paletteStorageKey(theme));
    if (!raw) return paletteFor(theme);
    return sanitizePalette(JSON.parse(raw) as Partial<Palette>, theme);
  } catch {
    return paletteFor(theme);
  }
}

function readClient(): Snapshot {
  if (!prefsReady) return serverSnapshot;
  const theme: ThemeName = document.documentElement.dataset.theme === "day" ? "day" : "night";
  const locale: Locale = document.documentElement.dataset.locale === "en" ? "en" : "zh";
  const grid = document.documentElement.dataset.grid === "on";
  const raw = localStorage.getItem(paletteStorageKey(theme)) ?? "";
  const key = `${theme}|${locale}|${grid ? "1" : "0"}|${raw}`;
  if (clientSnapshot.key === key) return clientSnapshot;
  clientSnapshot = { theme, locale, grid, key, palette: readStoredPalette(theme) };
  return clientSnapshot;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(PREFS_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(PREFS_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function emit() {
  window.dispatchEvent(new Event(PREFS_EVENT));
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=31536000;samesite=lax`;
}

function paint(theme: ThemeName, locale: Locale, palette: Palette, grid: boolean) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.dataset.locale = locale;
  root.dataset.grid = grid ? "on" : "off";
  root.lang = locale === "zh" ? "zh-CN" : "en";
  root.classList.toggle("dark", theme === "night");
  writeCookie("pji-theme", theme);
  writeCookie("pji-locale", locale);
  root.style.setProperty("--bg-start", palette.bgStart);
  root.style.setProperty("--bg-end", palette.bgEnd);
  root.style.setProperty("--glow-plum", palette.plum);
  root.style.setProperty("--glow-cobalt", palette.cobalt);
  root.style.setProperty("--glow-ember", palette.ember);
  root.style.setProperty("--glass-alpha", String(palette.glass));
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  localStorage.setItem(paletteStorageKey(theme), JSON.stringify(palette));
  emit();
}

type Preferences = {
  theme: ThemeName;
  locale: Locale;
  palette: Palette;
  grid: boolean;
  m: Messages;
  setTheme: (theme: ThemeName) => void;
  setLocale: (locale: Locale) => void;
  updatePalette: (partial: Partial<Palette>) => void;
  setGrid: (on: boolean) => void;
  resetPalette: () => void;
};

export function PreferencesProvider({
  initialTheme,
  initialLocale,
  children,
}: {
  initialTheme: ThemeName;
  initialLocale: Locale;
  children: ReactNode;
}) {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => (prefsReady ? readClient() : cachedServerSnapshot(initialTheme, initialLocale)),
    () => cachedServerSnapshot(initialTheme, initialLocale),
  );
  useEffect(() => {
    prefsReady = true;
    emit();
  }, []);
  const value: Preferences = {
    theme: snapshot.theme,
    locale: snapshot.locale,
    palette: snapshot.palette,
    grid: snapshot.grid,
    m: messages[snapshot.locale],
    setTheme: (next) => {
      paint(next, snapshot.locale, readStoredPalette(next), snapshot.grid);
    },
    setLocale: (next) => {
      paint(snapshot.theme, next, snapshot.palette, snapshot.grid);
    },
    updatePalette: (partial) => {
      paint(snapshot.theme, snapshot.locale, sanitizePalette({ ...snapshot.palette, ...partial }, snapshot.theme), snapshot.grid);
    },
    setGrid: (on) => {
      paint(snapshot.theme, snapshot.locale, snapshot.palette, on);
    },
    resetPalette: () => {
      localStorage.removeItem(paletteStorageKey(snapshot.theme));
      paint(snapshot.theme, snapshot.locale, paletteFor(snapshot.theme), snapshot.grid);
    },
  };
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

const PrefsContext = createContext<Preferences | null>(null);

export function usePreferences() {
  const value = useContext(PrefsContext);
  if (!value) throw new Error("PreferencesProvider is missing");
  return value;
}

export function useI18n() {
  const { locale, setLocale, m } = usePreferences();
  return { locale, setLocale, m };
}

export function Tr({ k, v }: { k: string; v?: Record<string, string | number> }) {
  const { m } = useI18n();
  return <>{translate(m, k, v)}</>;
}
