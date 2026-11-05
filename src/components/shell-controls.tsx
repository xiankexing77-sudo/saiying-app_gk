"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Languages, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { GLASS_ALPHA_MAX, GLASS_ALPHA_MIN, type Palette } from "@/lib/design/tokens";
import { LinearIcon } from "./linear-icon";
import { usePreferences } from "./preferences";

export function ShellControls() {
  const { m, theme, locale, palette, grid, setTheme, setLocale, updatePalette, setGrid, resetPalette } = usePreferences();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 items-center gap-2" role="group" aria-label={m.controls.theme}>
        <button type="button" className={chip(theme === "day")} aria-pressed={theme === "day"} onClick={() => setTheme("day")}>
          <LinearIcon icon={Sun} />
          <span className="hidden sm:inline">{m.controls.day}</span>
        </button>
        <button type="button" className={chip(theme === "night")} aria-pressed={theme === "night"} onClick={() => setTheme("night")}>
          <LinearIcon icon={Moon} />
          <span className="hidden sm:inline">{m.controls.night}</span>
        </button>
      </div>
      <div className="flex h-8 items-center gap-2" role="group" aria-label={m.controls.language}>
        <button type="button" className={chip(locale === "zh")} aria-pressed={locale === "zh"} onClick={() => setLocale("zh")}>
          <LinearIcon icon={Languages} />
          {m.controls.localeZh}
        </button>
        <button type="button" className={chip(locale === "en")} aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
          {m.controls.localeEn}
        </button>
      </div>
      <div className="relative" ref={rootRef}>
        <button
          type="button"
          className={chip(open)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <LinearIcon icon={SlidersHorizontal} />
          <span className="hidden md:inline">{m.controls.appearance}</span>
        </button>
        {open ? (
          <div
            id={panelId}
            role="dialog"
            aria-modal="false"
            aria-label={m.controls.appearance}
            data-slot="appearance-panel"
            className="glass glass-plum absolute right-0 z-50 mt-2 w-80 p-4"
          >
            <div className="flex flex-col gap-4">
              <ColorRow label={m.controls.bgStart} value={palette.bgStart} onChange={(bgStart) => updatePalette({ bgStart })} />
              <ColorRow label={m.controls.bgEnd} value={palette.bgEnd} onChange={(bgEnd) => updatePalette({ bgEnd })} />
              <ColorRow label={m.controls.plum} value={palette.plum} onChange={(plum) => updatePalette({ plum })} />
              <ColorRow label={m.controls.cobalt} value={palette.cobalt} onChange={(cobalt) => updatePalette({ cobalt })} />
              <ColorRow label={m.controls.ember} value={palette.ember} onChange={(ember) => updatePalette({ ember })} />
              <label className="flex flex-col gap-2 text-sm">
                <span className="flex items-center justify-between">
                  <span>{m.controls.glass}</span>
                  <span className="font-num">{Math.round(palette.glass * 100)}%</span>
                </span>
                <input
                  type="range"
                  min={GLASS_ALPHA_MIN}
                  max={GLASS_ALPHA_MAX}
                  step={0.01}
                  value={palette.glass}
                  onChange={(event) => updatePalette({ glass: Number(event.target.value) })}
                />
              </label>
              <label className="flex h-8 items-center justify-between gap-4 text-sm">
                <span>{m.controls.grid}</span>
                <input type="checkbox" checked={grid} onChange={(event) => setGrid(event.target.checked)} />
              </label>
              <button type="button" className="btn-glow" onClick={resetPalette}>
                {m.controls.reset}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {open ? <AppearanceBackdrop onDismiss={() => setOpen(false)} /> : null}
    </div>
  );
}

function AppearanceBackdrop({ onDismiss }: { onDismiss: () => void }) {
  return createPortal(
    <div
      data-slot="appearance-backdrop"
      aria-hidden="true"
      // Inline position and z-index beat unlayered `body > *` and sit under the
      // sticky shell (z-index 40), so the panel stays usable while the page does not.
      style={{ position: "fixed", inset: 0, zIndex: 30, background: "transparent" }}
      onPointerDown={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    />,
    document.body,
  );
}

function chip(active: boolean) {
  return active ? "nav-chip nav-chip-active" : "nav-chip";
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: Palette["bgStart"]) => void }) {
  return (
    <label className="flex h-8 items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <input className="color-input" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
