import assert from "node:assert/strict";
import test from "node:test";
import { runStubGraph } from "../agents/graph";
import { assertEntryUrl, ENTRY_ALLOWLIST } from "../collectors/sony/allowlist";
import { SonyAdapter } from "../collectors/sony/adapter";
import { dedupeRecords } from "../collectors/sony/dedupe";
import { normalizeTrack } from "../collectors/sony/normalize";
import { assertComparable, compareEditions, getJury, juryProfile, qualityReport } from "../src/lib/catalog";
import { database } from "../src/lib/data/seed";

test("official entry allowlist matches the PRD and rejects other hosts", () => {
  assert.equal(ENTRY_ALLOWLIST.length, 6);
  for (const url of ENTRY_ALLOWLIST) {
    assert.equal(assertEntryUrl(url), url);
    assert.equal(assertEntryUrl(`${url}/`), url);
  }
  assert.throws(() => assertEntryUrl("http://www.worldphoto.org/sony-world-photography-awards"));
  assert.throws(() => assertEntryUrl("https://example.com/sony-world-photography-awards"));
  assert.throws(() => assertEntryUrl("https://www.worldphoto.org/somewhere-else"));
  assert.throws(() => assertEntryUrl("https://user:pass@www.worldphoto.org/2026-judges"));
});

test("raw competition names stay intact while normalized tracks are stable", () => {
  const professional = normalizeTrack("Professional competition");
  const open = normalizeTrack("Open competition");
  assert.equal(professional?.normalizedTrack, "series");
  assert.equal(open?.normalizedTrack, "single_image");
  assert.equal(professional?.rawName, "Professional competition");
  for (const year of [2025, 2026]) {
    const raw = database.tracks.filter((track) => track.editionId === `swpa-${year}`).map((track) => track.rawName);
    assert.deepEqual(raw.sort(), [
      "Open competition",
      "Professional competition",
      "Student competition",
      "Youth competition",
    ]);
  }
  assert.equal(database.editions.some((edition) => edition.year === 2027), false);
});

test("duplicate winner keys collapse, repeat winners in another year do not", () => {
  const base = {
    officialSourceUrl: "https://www.worldphoto.org/sony-world-photography-awards/winners-galleries/2025/overall-winners-2025",
    officialImageUrl: null,
    photographerNames: ["Zed Nelson"],
    year: 2025,
    rawCategory: "Wildlife & Nature",
    awardNames: ["Category Winner"],
    title: "The Anthropocene Illusion",
  };
  const { kept, dropped } = dedupeRecords([base, { ...base }, { ...base, year: 2026 }]);
  assert.equal(kept.length, 2);
  assert.equal(dropped.length, 1);
});

test("seed quality checks pass and images are not hosted", () => {
  const report = qualityReport();
  assert.equal(report.ok, true, report.checks.filter((check) => !check.ok).map((check) => check.name).join("; "));
  assert.equal(database.imageAssets.every((asset) => asset.hostedBinary === false), true);
  assert.equal(database.imageAssets.every((asset) => asset.officialImageUrl === null), true);
});

test("series and single analyses use different schemas and only quote official text", () => {
  assert.ok(database.seriesAnalyses.length > 0);
  assert.ok(database.singleAnalyses.length > 0);
  assert.equal(database.seriesAnalyses.every((row) => row.schema === "series" && row.narrativeCoherence === null && row.pixelsRead === false), true);
  assert.equal(database.singleAnalyses.every((row) => row.schema === "single_image" && row.basicDescription === null && row.pixelsRead === false), true);
  const wide = database.singleAnalyses.find((row) => row.photographId === "single-2025-architecture");
  assert.equal(wide?.status, "text_grounded");
  assert.match(wide?.composition ?? "", /广角/);
  assert.equal(wide?.evidence.some((item) => item.quote.toLowerCase().includes("very wide angle")), true);
  const untitled = database.seriesAnalyses.find((row) => row.seriesId === "series-2025-creative");
  assert.equal(untitled?.status, "insufficient_text");
  assert.equal(untitled?.themeDevelopment, null);
  const bilha = database.series.find((item) => item.id === "series-2026-creative");
  assert.equal(bilha?.imageCount, 8);
  const bilhaAnalysis = database.seriesAnalyses.find((row) => row.seriesId === "series-2026-creative");
  assert.equal(bilhaAnalysis?.evidence.some((item) => item.quote.includes("The jury applauded")), false);
  const faithful = database.series.find((item) => item.id === "series-2026-portraiture");
  assert.equal(faithful?.photographerIds.length, 2);
});

test("judge profiles do not invent preference without three personal work groups", () => {
  for (const jury of database.juries) {
    const profile = juryProfile(jury.id);
    const groups = profile.personalWorks?.groups.length ?? 0;
    assert.equal(profile.inference?.kind, "inference");
    assert.ok((getJury(jury.id)?.name ?? "").length > 0);
    if (groups < 3) {
      assert.equal(profile.inference?.sampleStatus, "insufficient");
      assert.equal(profile.inference?.visualStyle, null);
      assert.equal(profile.inference?.colorTendency, null);
      assert.equal(profile.inference?.confidence, null);
      assert.equal(profile.inference?.styleTags.length, 0);
      assert.match(profile.inference?.statement ?? "", /样本不足/);
    } else {
      assert.equal(profile.inference?.sampleStatus, "sufficient");
      assert.ok((profile.inference?.styleTags.length ?? 0) > 0);
      assert.ok(profile.inference?.styleTags.every((tag) => tag.evidence.length > 0));
    }
  }
});

test("cross-track comparison is refused and same-track rows stay paired", () => {
  assert.throws(() => assertComparable("series", "single_image"));
  const comparison = compareEditions("series", "cat-series-creative");
  assert.equal(comparison.ok, true);
  if (!comparison.ok) return;
  assert.equal(comparison.rows.length, 1);
  assert.equal(comparison.rows[0]?.left?.title, "Rhi-Entry");
  assert.equal(comparison.rows[0]?.right?.title, "Bilha, Stories of my Sisters");
  assert.equal(comparison.inference.pixelTrend, "not_generated");
  const architecture = compareEditions("single_image", "cat-single_image-architecture");
  assert.equal(architecture.ok, true);
  if (!architecture.ok) return;
  assert.equal(architecture.rows[0]?.rawCategory, "Architecture");
  assert.notEqual(architecture.rows[0]?.categoryId, "cat-series-architecture-design");
});

test("SonyAdapter reads the seed without claiming a live crawl", () => {
  const adapter = new SonyAdapter();
  const editions = adapter.discoverEditions();
  assert.deepEqual(editions.map((edition) => edition.year), [2025, 2026]);
  for (const edition of editions) {
    const winners = adapter.extractWinners(edition);
    const juries = adapter.extractJuries(edition);
    assert.ok(winners.length >= 22);
    assert.ok(juries.length >= 8);
    assert.equal(new Set(winners.map((winner) => winner.rawCompetitionName)).size, 4);
    assert.equal(adapter.extractOfficialImages(edition).every((image) => image.officialImageUrl === null), true);
  }
  const graph = runStubGraph([2025, 2026]);
  const imageNode = graph.nodes.find((node) => node.stage === "image_analysis");
  assert.equal(imageNode?.status, "blocked");
  assert.match(imageNode?.summary ?? "", /像素/);
  assert.match(imageNode?.summary ?? "", /文本/);
});
