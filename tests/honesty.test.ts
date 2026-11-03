import assert from "node:assert/strict";
import test from "node:test";
import { getAnalyses, getAwardsForWork, getJudge, getJudgesByYear, getWorks } from "../src/lib/catalog";
import { AWARD_TYPES, CATEGORY_CODES } from "../src/lib/types";

const banned = [/评分/, /打分/, /分数/, /满分/, /钦点/, /单独选/, /一人选/, /官方结果/, /原话/];

test("two best-of-year works are findable with the published fields", () => {
  const works = getWorks();
  const twenty26 = works.find((work) => work.year === 2026 && work.title === "地球之巅");
  const twenty25 = works.find((work) => work.year === 2025 && work.title === "太空战舰");
  assert.ok(twenty26);
  assert.equal(twenty26.photographer, "CHUNLIN");
  assert.equal(twenty26.phone_model, "X300 Ultra");
  assert.equal(getAwardsForWork(twenty26.id).some((award) => award.award_type === "年度最佳"), true);
  assert.ok(twenty25);
  assert.equal(twenty25.phone_model, "X200 Pro");
  assert.equal(
    [twenty25.photographer, ...twenty25.name_aliases.map((alias) => alias.name)].includes("歪杰"),
    true,
  );
  assert.equal(getAwardsForWork(twenty25.id).some((award) => award.award_type === "年度最佳"), true);
});

test("each year has 25 award-winning works and only known enums", () => {
  for (const year of [2025, 2026] as const) {
    const works = getWorks().filter((work) => work.year === year && work.is_award_winning);
    assert.equal(works.length, 25);
  }
  const categories = new Set(getWorks().map((work) => work.category_id));
  assert.equal(categories.size, CATEGORY_CODES.length);
  for (const work of getWorks()) {
    for (const award of getAwardsForWork(work.id)) {
      assert.ok(AWARD_TYPES.includes(award.award_type));
    }
  }
});

test("judge seats match the two editions", () => {
  assert.deepEqual(
    getJudgesByYear(2026).map((judge) => judge.name),
    ["黎晓亮", "肖全", "Francesco Gola", "Bertram Hönlinger", "于猛"],
  );
  assert.deepEqual(
    getJudgesByYear(2025).map((judge) => judge.name),
    ["肖全", "Francesco Gola", "Bertram Hönlinger", "于猛", "Alex Webb"],
  );
  assert.equal(getJudge("judge-li")?.bio_official, "");
  assert.ok((getJudge("judge-webb")?.style_tags_inferred.length ?? 0) > 0);
});

test("every analysis stays inside the honesty rules", () => {
  const analyses = getAnalyses();
  assert.ok(analyses.length >= 50);
  for (const analysis of analyses) {
    assert.equal(analysis.status, "ready");
    assert.match(analysis.evidence_json.disclaimer, /学习向推断/);
    assert.ok(analysis.evidence_json.sources.length > 0);
    const blob = [
      analysis.summary,
      analysis.evidence_json.inferred_column ?? "",
      ...(analysis.evidence_json.points ?? []),
      ...(analysis.evidence_json.exercises ?? []),
    ].join("\n");
    for (const pattern of banned) {
      assert.equal(pattern.test(blob), false, `${analysis.id} matched ${pattern}`);
    }
    assert.doesNotMatch(blob, /因为点赞|点赞越高|点赞说明|高赞/);
  }
  for (const work of getWorks()) {
    const card = analyses.find((item) => item.kind === "selection_reason" && item.target_id === work.id);
    assert.ok(card);
    assert.ok((card.evidence_json.points?.length ?? 0) >= 3);
    assert.ok((card.evidence_json.exercises?.length ?? 0) >= 1);
    const zeiss = getAwardsForWork(work.id).some((award) => award.award_type === "蔡司专业风格奖");
    if (zeiss) assert.match(card.summary, /终审/);
    for (const comment of work.official_comments) {
      const snippet = comment.text.slice(0, 24);
      assert.equal(card.summary.includes(snippet), false, work.title);
    }
  }
});
