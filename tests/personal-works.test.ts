import assert from "node:assert/strict";
import test from "node:test";
import { generateStyleTags, STYLE_MODEL_NAME, STYLE_MODEL_VERSION } from "../agents/style-tags";
import { assertPortfolioUrl } from "../collectors/portfolio/allowlist";
import { collectCandidates } from "../collectors/portfolio/collect";
import type { FixtureCandidate } from "../collectors/portfolio/fixture";
import { SEED_FETCHED_AT } from "../src/lib/data/sources";
import type { SampleGroup } from "../src/lib/data/types";
import { juryProfile } from "../src/lib/catalog";
import { database } from "../src/lib/data/seed";

test("portfolio urls stay on the allowlist", () => {
  assert.equal(
    assertPortfolioUrl("https://www.bindivora.co.uk/works/mountain-of-salt/"),
    "https://www.bindivora.co.uk/works/mountain-of-salt/",
  );
  assert.throws(() => assertPortfolioUrl("http://www.bindivora.co.uk/works/"));
  assert.throws(() => assertPortfolioUrl("https://user:pass@www.bindivora.co.uk/works/"));
  assert.throws(() => assertPortfolioUrl("https://example.com/portfolio"));
  assert.throws(() => assertPortfolioUrl("https://127.0.0.1/portfolio"));
  assert.throws(() => assertPortfolioUrl("https://www.cnn.com/travel/"));
});

test("three personal work groups produce evidence-backed style tags", () => {
  const profile = juryProfile("bindi-vora");
  const works = profile.personalWorks;
  assert.ok(works);
  assert.equal(works.groups.length, 4);
  assert.equal(works.network, false);
  assert.equal(works.groups.find((group) => group.title === "Mountain of Salt")?.sources.length, 3);
  assert.equal(works.groups.filter((group) => group.title === "Mountain of Salt").length, 1);
  assert.equal(works.groups.every((group) => group.authorship === "own_work" && group.hostedBinary === false), true);
  assert.equal(works.groups.every((group) => group.rightsStatus === "rights_blocked" && group.officialImageUrl === null), true);
  for (const group of works.groups) {
    for (const claim of group.claims) {
      const source = group.sources.find((item) => item.url === claim.sourceUrl);
      assert.ok(source, claim.key);
      assert.equal(source.excerpt.includes(claim.quote), true);
    }
  }
  const inference = profile.inference;
  assert.equal(inference?.sampleStatus, "sufficient");
  assert.equal(inference?.sampleCount, 4);
  assert.equal(inference?.modelName, STYLE_MODEL_NAME);
  assert.equal(inference?.modelVersion, STYLE_MODEL_VERSION);
  assert.equal(inference?.visualStyle?.includes("拼贴"), true);
  assert.equal(inference?.colorTendency, null);
  assert.equal(inference?.compositionTendency, null);
  const collage = inference?.styleTags.find((tag) => tag.id === "tag-bindi-vora-collage");
  assert.equal(collage?.scope, "cross_group");
  assert.equal(collage?.sampleCount, 3);
  assert.ok((collage?.confidence ?? 1) <= 0.7);
  assert.ok(collage?.evidence.every((item) => !item.sourceUrl.includes("/judges")));
  const colour = inference?.styleTags.find((tag) => tag.id === "tag-bindi-vora-colour_as_pigment");
  assert.equal(colour?.scope, "single_group");
  assert.equal(colour?.sampleCount, 1);
  assert.match(inference?.statement ?? "", /没有读取像素/);
  assert.match(inference?.statement ?? "", /没有使用职务简介/);
});

test("fewer than three groups stays insufficient and does not keep the claims as preference", () => {
  const paul = juryProfile("paul-ninson");
  assert.equal(paul.personalWorks?.groups.length, 2);
  assert.equal(paul.personalWorks?.groups.some((group) => group.title === "Feeding Ghana"), true);
  assert.equal(paul.personalWorks?.groups.some((group) => group.title === "Village with No Men"), true);
  assert.equal(paul.personalWorks?.rejected.some((item) => item.reason === "missing_description"), true);
  assert.equal(paul.inference?.sampleStatus, "insufficient");
  assert.equal(paul.inference?.styleTags.length, 0);
  assert.equal(paul.inference?.visualStyle, null);
  assert.equal(paul.inference?.commonSubjects, null);
  assert.equal(paul.inference?.confidence, null);
  assert.match(paul.inference?.statement ?? "", /样本不足/);
  assert.equal(paul.inference?.statement.includes("从事供食"), false);

  const monica = juryProfile("monica-allende");
  assert.equal(monica.personalWorks?.groups.length, 0);
  assert.equal(
    monica.personalWorks?.rejected.some((item) => item.reason === "not_own_work" && item.title === "The Anthropocene Illusion"),
    true,
  );
  assert.equal(monica.inference?.sampleStatus, "insufficient");
  assert.equal(monica.inference?.styleTags.length, 0);
  assert.equal(database.personalWorks.every((row) => row.groups.every((group) => group.title !== "The Anthropocene Illusion")), true);
});

test("the agent refuses tags until three groups exist, even when the claims look stylistic", () => {
  const two = [sample("a", ["collage"]), sample("b", ["collage"])];
  const blocked = generateStyleTags({ subjectId: "synthetic", groups: two, analyzedAt: SEED_FETCHED_AT });
  assert.equal(blocked.sampleStatus, "insufficient");
  assert.equal(blocked.styleTags.length, 0);
  assert.equal(blocked.visualStyle, null);

  const three = [sample("a", ["collage"]), sample("b", ["collage", "colour_as_pigment"]), sample("c", ["sea_surface"])];
  const ready = generateStyleTags({ subjectId: "synthetic", groups: three, analyzedAt: SEED_FETCHED_AT });
  assert.equal(ready.sampleStatus, "sufficient");
  assert.equal(ready.visualStyle, "拼贴");
  assert.equal(ready.colorTendency, null);
  assert.equal(ready.commonSubjects, null);
  assert.equal(ready.styleTags.find((tag) => tag.label === "色彩汇流")?.scope, "single_group");
  assert.equal(ready.confidence, 0.56);
});

test("unsafe and non-authored candidates never become groups", () => {
  const result = collectCandidates(
    { id: "x", name: "X", officialProfileUrls: ["http://www.worldphoto.org/2026-judges"] },
    [
      candidate("bad-host", "https://example.com/work", "a published series of collages"),
      candidate("bad-scheme", "http://www.bindivora.co.uk/works/mountain-of-salt/", "digital shape collages"),
      {
        ...candidate("comment", "https://www.sony.co.uk/presscentre/sony-world-photography-awards-overall-winners-2025-announced", "found images"),
        authorship: "judged_or_commented",
        title: "Someone Else",
      },
    ],
  );
  assert.equal(result.groups.length, 0);
  assert.deepEqual(
    result.rejected.map((item) => item.reason).sort(),
    ["not_own_work", "unsafe_url", "unsafe_url"],
  );
});

function sample(id: string, keys: string[]): SampleGroup {
  const url = `https://www.bindivora.co.uk/works/${id}`;
  const excerpt = "digital shape collages and found images. As the colours coalesce and flow into one another. curiosity with the surface of the sea";
  return {
    id,
    subjectId: "synthetic",
    title: id,
    yearLabel: null,
    authorship: "own_work",
    imageCount: null,
    imageCountNote: "测试",
    rightsStatus: "rights_blocked",
    hostedBinary: false,
    officialImageUrl: null,
    sources: [
      {
        sourceId: `src-${id}`,
        url,
        pageTitle: id,
        channel: "personal_site",
        excerpt,
        fetchedAt: SEED_FETCHED_AT,
        contentHash: null,
        parserVersion: "test",
        extractionVersion: "test",
        collectionMode: "curated_seed",
      },
    ],
    claims: keys.map((key) => ({
      key,
      quote:
        key === "colour_as_pigment"
          ? "As the colours coalesce and flow into one another"
          : key === "sea_surface"
            ? "curiosity with the surface of the sea"
            : "digital shape collages",
      sourceUrl: url,
    })),
  };
}

function candidate(bodyKey: string, url: string, excerpt: string): FixtureCandidate {
  return {
    subjectId: "x",
    bodyKey,
    title: bodyKey,
    yearLabel: null,
    authorship: "own_work",
    channel: "personal_site",
    url,
    pageTitle: bodyKey,
    excerpt,
    imageCount: null,
    imageCountNote: "测试",
    claims: [],
  };
}
