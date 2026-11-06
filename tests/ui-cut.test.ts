import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_LOCALE, messages } from "../src/lib/i18n/messages";
import {
  DEFAULT_THEME,
  GLASS_ALPHA,
  GLASS_ALPHA_MAX,
  GLASS_ALPHA_MIN,
  ICON_STROKE,
  NIGHT_PALETTE,
  SPACE,
  clampGlass,
} from "../src/lib/design/tokens";

test("ui cut defaults to chinese, night, and the approved palette", () => {
  assert.equal(DEFAULT_LOCALE, "zh");
  assert.equal(DEFAULT_THEME, "night");
  assert.equal(messages.zh.nav.home, "总览");
  assert.notEqual(messages.en.nav.home, messages.zh.nav.home);
  assert.equal(messages.en.nav.analyze, "Analyze");
  assert.equal(NIGHT_PALETTE.bgStart, "#2e1065");
  assert.equal(NIGHT_PALETTE.bgEnd, "#060607");
  assert.equal(NIGHT_PALETTE.plum.toLowerCase(), "#c084fc");
  assert.equal(NIGHT_PALETTE.cobalt.toLowerCase(), "#60a5fa");
  assert.equal(NIGHT_PALETTE.ember.toLowerCase(), "#fb923c");
});

test("spacing, icon stroke, and glass alpha stay inside the cut", () => {
  assert.equal(SPACE, 8);
  assert.equal(ICON_STROKE, 1.6);
  assert.ok(GLASS_ALPHA >= GLASS_ALPHA_MIN && GLASS_ALPHA <= GLASS_ALPHA_MAX);
  assert.equal(clampGlass(0.01), GLASS_ALPHA_MIN);
  assert.equal(clampGlass(0.5), GLASS_ALPHA_MAX);
  assert.equal(clampGlass(0.08), 0.08);
});

test("appearance panel closes from the backdrop and escape", () => {
  const source = readFileSync("src/components/shell-controls.tsx", "utf8");
  assert.match(source, /data-slot="appearance-panel"/);
  assert.match(source, /data-slot="appearance-backdrop"/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /event\.key !== "Escape"/);
  assert.match(source, /zIndex: 30/);
  const dialog = readFileSync("src/components/ui/dialog.tsx", "utf8");
  assert.match(dialog, /DialogPrimitive\.Backdrop/);
  assert.doesNotMatch(dialog, /disablePointerDismissal/);
});

test("vendored fonts keep their SIL OFL licenses and are not Arial", () => {
  const geist = readFileSync("src/fonts/OFL-Geist.txt", "utf8");
  const departure = readFileSync("src/fonts/OFL-DepartureMono.txt", "utf8");
  assert.match(geist, /SIL Open Font License, Version 1\.1/);
  assert.match(geist, /Geist Project Authors/);
  assert.match(departure, /SIL Open Font License, Version 1\.1/);
  assert.match(departure, /Helena Zhang/);
  assert.ok(readFileSync("src/fonts/Geist-Light.woff2").byteLength > 1000);
  assert.ok(readFileSync("src/fonts/Geist-Regular.woff2").byteLength > 1000);
  assert.ok(readFileSync("src/fonts/Geist-Medium.woff2").byteLength > 1000);
  assert.ok(readFileSync("src/fonts/DepartureMono-Regular.woff2").byteLength > 1000);
  const layout = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(layout, /adjustFontFallback:\s*false/);
  assert.doesNotMatch(readFileSync("src/app/globals.css", "utf8"), /Arial/);
});
