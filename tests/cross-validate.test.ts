import assert from "node:assert/strict";
import test from "node:test";
import { runStubGraph } from "../agents/graph";
import { crossValidate, normalizeFactValue } from "../collectors/cross-validate";
import { collectEdition } from "../collectors/multi-source";
import { assertSafePublicUrl } from "../collectors/safety";
import { SonyAdapter } from "../collectors/sony/adapter";
import { winnerKey } from "../collectors/sony/project-seed";
import { sources } from "../src/lib/data/sources";
import type { SourceObservation } from "../collectors/types";

function observation(partial: Pick<SourceObservation, "sourceId" | "value" | "role"> & Partial<SourceObservation>): SourceObservation {
  return {
    editionYear: 2026,
    entityKey: "winner:2026:demo",
    entityLabel: "demo",
    field: "winner.photographer",
    workId: "demo",
    sourceUrl: "https://www.worldphoto.org/sony-world-photography-awards",
    sourcePageTitle: partial.sourceId,
    fetchedAt: "2026-11-03T15:00:00.000Z",
    contentHash: null,
    parserVersion: "test",
    extractionVersion: "test",
    publisher: partial.role === "organizer_mirror" ? "sony_press" : "worldphoto.org",
    ...partial,
  };
}

test("two sources agreeing keep the higher priority wording", () => {
  const fields = crossValidate([
    observation({
      sourceId: "press",
      role: "organizer_mirror",
      field: "winner.title",
      value: "Bilha, Stories of My Sisters",
    }),
    observation({
      sourceId: "gallery",
      role: "official_related",
      field: "winner.title",
      value: "Bilha, Stories of my Sisters",
    }),
  ]);
  assert.equal(fields.length, 1);
  assert.equal(fields[0]?.verdict, "agree");
  assert.equal(fields[0]?.preferredValue, "Bilha, Stories of my Sisters");
  assert.equal(fields[0]?.preferredRole, "official_related");
  assert.equal(fields[0]?.confidenceLabel, "中");
  assert.equal(fields[0]?.observations.every((item) => item.agreesWithPreferred), true);
});

test("two sources conflicting keep both values and prefer the official page", () => {
  const fields = crossValidate([
    observation({
      sourceId: "press",
      role: "organizer_mirror",
      value: "Siavosh Ejlali",
      sourceUrl: "https://www.sony.com.my/pressrelease?prName=overall-winners-2026",
    }),
    observation({
      sourceId: "blog",
      role: "official_related",
      value: "Siavosh Eljali",
      sourceUrl: "https://www.worldphoto.org/blogs/17-02-26/2026-open-competition-category-winners-and-shortlists-announced",
    }),
  ]);
  const field = fields[0];
  assert.equal(field?.verdict, "conflict");
  assert.equal(field?.preferredValue, "Siavosh Eljali");
  assert.equal(field?.confidence, null);
  assert.equal(field?.observations.length, 2);
  assert.equal(field?.observations.some((item) => item.value === "Siavosh Ejlali" && item.agreesWithPreferred === false), true);
  assert.match(field?.preferredReason ?? "", /不覆盖/);
});

test("a single source is not marked as agreement", () => {
  const fields = crossValidate([observation({ sourceId: "only", role: "official_primary", value: "Zed Nelson" })]);
  assert.equal(fields[0]?.verdict, "single_source");
  assert.equal(fields[0]?.confidenceLabel, "低");
});

test("spelling differences stay conflicts and case differences do not", () => {
  assert.equal(normalizeFactValue("Siavosh Eljali"), normalizeFactValue("siavosh eljali"));
  assert.notEqual(normalizeFactValue("Siavosh Eljali"), normalizeFactValue("Siavosh Ejlali"));
  assert.equal(normalizeFactValue("  Stories   of my Sisters "), normalizeFactValue("stories of my sisters"));
  assert.equal(normalizeFactValue("   "), null);
});

test("SWPA fixtures agree on Zed Nelson and conflict on Siavosh", () => {
  const agree = collectEdition(2025);
  const zed = agree.fields.find(
    (field) => field.entityKey === winnerKey(2025, "series", "Wildlife & Nature") && field.field === "winner.photographer",
  );
  assert.equal(zed?.verdict, "agree");
  assert.equal(zed?.preferredValue, "Zed Nelson");
  assert.equal(zed?.preferredRole, "official_primary");
  assert.ok(zed && zed.observations.length >= 2);
  assert.ok(zed?.observations.some((item) => item.sourceUrl.includes("overall-winners-2025")));
  assert.ok(zed?.observations.some((item) => item.sourceUrl.includes("sony.co.uk")));
  assert.ok(zed?.observations.every((item) => item.fetchedAt && item.parserVersion && item.extractionVersion));

  const conflict = collectEdition(2026);
  const name = conflict.fields.find(
    (field) => field.entityKey === winnerKey(2026, "single_image", "Creative") && field.field === "winner.photographer",
  );
  assert.equal(name?.verdict, "conflict");
  assert.equal(name?.preferredValue, "Siavosh Eljali");
  assert.equal(name?.preferredRole, "official_related");
  const spellings = name?.observations.map((item) => item.value).sort();
  assert.deepEqual(spellings, ["Siavosh Ejlali", "Siavosh Eljali"]);
  const title = conflict.fields.find(
    (field) => field.entityKey === winnerKey(2026, "single_image", "Creative") && field.field === "winner.title",
  );
  assert.equal(title?.verdict, "single_source");
  assert.equal(title?.preferredValue, "Lost Hope");

  const bilha = conflict.fields.find(
    (field) => field.entityKey === winnerKey(2026, "series", "Creative") && field.field === "winner.title",
  );
  assert.equal(bilha?.verdict, "agree");
  assert.equal(bilha?.preferredValue, "Bilha, Stories of my Sisters");
  assert.ok(bilha?.observations.some((item) => item.value === "Bilha, Stories of My Sisters"));
});

test("image extracts stay rights blocked and collection does not fetch", () => {
  const original = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network");
  };
  try {
    for (const year of [2025, 2026] as const) {
      const report = collectEdition(year);
      assert.equal(report.network, false);
      assert.equal(report.fetchPolicy.loginBypass, false);
      assert.equal(report.fetchPolicy.storesImageBinaries, false);
      assert.equal(report.fetchPolicy.robots, "not_contacted");
      const images = report.fields.filter((field) => field.field === "winner.image_url");
      const rights = report.fields.filter((field) => field.field === "winner.rights");
      assert.ok(images.length > 0);
      assert.ok(images.every((field) => field.observations.every((item) => item.value === null)));
      assert.ok(rights.every((field) => field.observations.every((item) => item.value === "rights_blocked")));
      for (const field of report.fields) {
        const seen = new Map<string, string | null>();
        for (const item of field.observations) {
          const previous = seen.get(item.sourceId);
          if (previous !== undefined) {
            assert.equal(normalizeFactValue(previous), normalizeFactValue(item.value));
          }
          seen.set(item.sourceId, item.value);
        }
      }
    }
  } finally {
    globalThis.fetch = original;
  }
});

test("known source URLs pass the safety check and other hosts do not", () => {
  for (const source of sources) {
    assert.equal(assertSafePublicUrl(source.url), source.url);
  }
  assert.throws(() => assertSafePublicUrl("http://www.worldphoto.org/sony-world-photography-awards"));
  assert.throws(() => assertSafePublicUrl("https://user:pass@www.worldphoto.org/2026-judges"));
  assert.throws(() => assertSafePublicUrl("https://127.0.0.1/"));
  assert.throws(() => assertSafePublicUrl("https://169.254.169.254/"));
  assert.throws(() => assertSafePublicUrl("https://10.0.0.1/"));
  assert.throws(() => assertSafePublicUrl("https://192.168.0.1/"));
  assert.throws(() => assertSafePublicUrl("https://[::1]/"));
  assert.throws(() => assertSafePublicUrl("https://example.com/awards"));
  assert.throws(() => assertSafePublicUrl("https://www.worldphoto.org:8443/2026-judges"));
  assert.throws(() => collectEdition(2027));
});

test("SonyAdapter collect exposes agree and conflict without a live crawl", () => {
  const adapter = new SonyAdapter();
  const collected = adapter.collect({ year: 2026, officialLabel: "Sony World Photography Awards 2026" });
  assert.equal(collected.network, false);
  assert.ok(collected.summary.agree >= 1);
  assert.ok(collected.summary.conflict >= 1);
  const graph = runStubGraph([2025, 2026]);
  const collection = graph.nodes.find((node) => node.stage === "collection");
  assert.equal(collection?.status, "passed");
  assert.match(collection?.summary ?? "", /冲突/);
  assert.match(graph.state.notes.join(" "), /不改写冲突/);
});
