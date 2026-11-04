import assert from "node:assert/strict";
import test from "node:test";
import { settleTask } from "../agents/settle-task";
import { analyzeSingleText } from "../agents/text-evidence";
import { juryResearchGraph } from "../src/lib/jury-graph";
import { compareEditions, qualityReport } from "../src/lib/catalog";
import { measureSamples } from "../src/lib/measure";
import type { AgentTask } from "../src/lib/data/types";

test("user caption fills only phrases that appear, and ignores the rest", () => {
  const grounded = analyzeSingleText({
    id: "user-1",
    photographId: "user-local",
    text: "a black-and-white portrait in a bedroom",
    sourceUrl: null,
    analyzedAt: "2026-11-04T00:00:00.000Z",
    basis: "user_caption",
  });
  assert.equal(grounded.status, "text_grounded");
  assert.equal(grounded.color, "黑白");
  assert.equal(grounded.subjectScene, "卧室");
  assert.equal(grounded.composition, null);
  assert.equal(grounded.narrative, null);
  assert.equal(grounded.pixelsRead, false);
  assert.match(grounded.evidenceNote, /用户输入/);
  for (const item of grounded.evidence) {
    assert.equal(grounded && "a black-and-white portrait in a bedroom".includes(item.quote), true);
  }

  const empty = analyzeSingleText({
    id: "user-2",
    photographId: "user-local",
    text: "hello",
    sourceUrl: null,
    analyzedAt: "2026-11-04T00:00:00.000Z",
    basis: "user_caption",
  });
  assert.equal(empty.status, "insufficient_text");
  assert.equal(empty.theme, null);
  assert.equal(empty.evidence.length, 0);
  assert.equal(empty.confidence, null);
});

test("same-track report quotes text and leaves pixel trends empty", () => {
  const report = qualityReport();
  assert.equal(report.ok, true, report.checks.filter((check) => !check.ok).map((check) => check.detail).join("; "));
  const open = compareEditions("single_image");
  assert.equal(open.ok, true);
  if (!open.ok) return;
  assert.equal(open.inference.pixelTrend, "not_generated");
  const color = open.inference.dimensions.find((dimension) => dimension.id === "color");
  assert.equal(color?.status, "text_quoted");
  const quotes = color?.years.flatMap((year) => year.items.map((item) => item.quote)) ?? [];
  assert.ok(quotes.some((quote) => quote.toLowerCase().includes("black-and-white")));
  const series = compareEditions("series");
  assert.equal(series.ok, true);
  if (!series.ok) return;
  assert.equal(series.rows.some((row) => row.rawCategory === "Architecture"), false);
  assert.equal(series.inference.dimensions.find((dimension) => dimension.id === "color")?.status, "not_generated");
});

test("jury graph records assignments and refuses vote edges", () => {
  const bindi = juryResearchGraph("bindi-vora");
  assert.ok(bindi);
  assert.ok(bindi.nodes.some((node) => node.kind === "sample_group"));
  assert.ok(bindi.edges.some((edge) => edge.relation === "依据样本组"));
  assert.equal(bindi.edges.some((edge) => /投票|选择/.test(edge.relation)), false);
  assert.match(bindi.absent[0] ?? "", /匿名评审/);
  const paul = juryResearchGraph("paul-ninson");
  assert.ok(paul);
  assert.ok(paul.gaps.some((gap) => gap.includes("样本不足")));
  assert.equal(paul.edges.some((edge) => edge.relation === "依据样本组"), false);
});

test("pixel samples name a dominant hue only when one bucket leads", () => {
  const red = measureSamples(Array.from({ length: 12 }, () => ({ r: 220, g: 20, b: 20 })));
  assert.equal(red.dominantHue, "红");
  assert.ok((red.warmCool ?? 0) > 0);
  const gray = measureSamples([
    { r: 120, g: 120, b: 120 },
    { r: 40, g: 40, b: 40 },
    { r: 200, g: 180, b: 30 },
  ]);
  assert.equal(gray.dominantHue, null);
  const none = measureSamples([]);
  assert.equal(none.meanLuminance, null);
  assert.equal(none.dominantHue, null);
});

test("in-process research finishes without pixels, and shortlist stays blocked", () => {
  const base = {
    status: "queued" as const,
    stage: "已入队",
    total: 8,
    completed: 0,
    failed: 0,
    currentItem: null,
    errorLog: [],
    startedAt: null,
    finishedAt: null,
    years: [2025, 2026],
  };
  const research = settleTask(
    {
      ...base,
      id: "task-test-research",
      type: "research",
      title: "研究",
      idempotencyKey: "test-research",
      scope: {
        winners: true,
        shortlists: false,
        juries: true,
        juryPortfolios: true,
        imageAnalysis: true,
        reportGeneration: true,
      },
      stages: [],
    } satisfies AgentTask,
    "2026-11-04T00:00:00.000Z",
  );
  assert.equal(research.status, "succeeded");
  assert.equal(research.stages.find((stage) => stage.stage === "image_analysis")?.status, "blocked");
  assert.equal(research.stages.find((stage) => stage.stage === "collection")?.status, "passed");
  assert.match(research.errorLog.join(" "), /rights_blocked|像素/);

  const shortlist = settleTask(
    {
      ...base,
      id: "task-test-shortlist",
      type: "research",
      title: "含入围",
      idempotencyKey: "test-shortlist",
      scope: {
        winners: true,
        shortlists: true,
        juries: false,
        juryPortfolios: false,
        imageAnalysis: false,
        reportGeneration: false,
      },
      stages: [],
    } satisfies AgentTask,
    "2026-11-04T00:00:00.000Z",
  );
  assert.equal(shortlist.status, "blocked");
  assert.match(shortlist.stages.find((stage) => stage.stage === "collection")?.summary ?? "", /Shortlist/);

  const pixels = settleTask(
    {
      ...base,
      id: "task-test-pixels",
      type: "analyze",
      title: "像素",
      idempotencyKey: "test-pixels",
      scope: null,
      stages: [],
    } satisfies AgentTask,
    "2026-11-04T00:00:00.000Z",
  );
  assert.equal(pixels.status, "blocked");
  assert.equal(pixels.completed, 0);
});
