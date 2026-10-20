import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildCourseUnits,
  courseEntryHref,
  filterCourseUnits,
} from "../src/lib/courseOverview.ts";
import { apcsPastExamUnits } from "../src/lib/apcsPastExamCourse.ts";
import { toiCourseTopics } from "../src/lib/toiCourseCurriculum.ts";

function entry(id, code, difficulty = "easy", type = "PROGRAMMING") {
  return {
    id,
    problemId: id,
    problem: {
      id,
      order: id,
      problemCode: code,
      title: `題目 ${code}`,
      type,
      isPublic: true,
      category: null,
      difficulty,
    },
  };
}

test("all APCS archived entries have one primary home and keep saved order within topics", () => {
  const codes = apcsPastExamUnits.flatMap((unit) => unit.codes);
  const entries = codes.map((code, index) => entry(index + 1, code)).reverse();
  const units = buildCourseUnits("APCS 歷屆", entries);
  assert.equal(units.flatMap((unit) => unit.entries).length, entries.length);
  for (const unit of units)
    assert.deepEqual(
      unit.entries,
      entries.filter((item) => unit.entries.includes(item)),
    );
  assert.equal(
    new Set(units.flatMap((unit) => unit.entries.map((item) => item.id))).size,
    entries.length,
  );
});

test("TOI topics keep teacher order without assigning unknown codes to a false tutorial", () => {
  const codes = toiCourseTopics.flatMap((unit) => unit.codes);
  const entries = codes.map((code, index) => entry(index + 1, code)).reverse();
  entries.push(entry(1000, "a999"));
  const units = buildCourseUnits("TOI 新手組 練習", entries);
  assert.equal(units.at(-1).id, "additional");
  assert.equal(units.flatMap((unit) => unit.entries).length, entries.length);
  for (const unit of units)
    assert.deepEqual(
      unit.entries,
      entries.filter((item) => unit.entries.includes(item)),
    );
  assert.equal(
    courseEntryHref(4, "TOI 新手組 練習", entries.at(-1)),
    "/problems/a999",
  );
});

test("ordinary courses preserve the complete saved sequence including mixed and unknown difficulty", () => {
  const entries = [
    entry(1, "a029", "hard"),
    entry(2, "a006"),
    entry(3, "a999", "custom"),
    entry(4, "a010"),
    entry(5, null, "medium", "RECOGNITION"),
  ];
  const units = buildCourseUnits("一般課程", entries);
  assert.deepEqual(
    units.map((unit) => unit.id),
    ["course-1"],
  );
  assert.deepEqual(
    units[0].entries.map((item) => item.id),
    [1, 2, 3, 4, 5],
  );
  assert.equal(
    courseEntryHref(
      1,
      "APCS 實作題：由簡到難",
      entry(6, "a006", "easy", "RECOGNITION"),
    ),
    "/recognition/q/6",
  );
  assert.equal(courseEntryHref(1, "一般課程", entry(7, null)), null);
});

test("long ordinary courses split consecutive units without losing or reordering entries", () => {
  const entries = Array.from({ length: 45 }, (_, index) =>
    entry(index + 1, `a${index + 100}`, index % 2 ? "hard" : "easy"),
  ).reverse();
  const units = buildCourseUnits("自訂課程", entries);
  assert.deepEqual(
    units.map((unit) => unit.entries.length),
    [20, 20, 5],
  );
  assert.deepEqual(
    units.flatMap((unit) => unit.entries),
    entries,
  );
  assert.deepEqual(
    filterCourseUnits("自訂課程", units, { level: "hard" }).units.flatMap(
      (unit) => unit.entries,
    ),
    entries.filter((item) => item.problem.difficulty === "hard"),
  );
});

test("filters accept repeated parameters, ignore invalid selections and never mutate full units", () => {
  const units = buildCourseUnits("一般課程", [
    entry(1, "a006"),
    entry(2, "a029", "hard"),
  ]);
  const filtered = filterCourseUnits("一般課程", units, {
    q: [" A029 ", "a006"],
    level: ["hard", "easy"],
    topic: ["course-1", "invalid"],
  });
  assert.equal(filtered.count, 1);
  assert.equal(filtered.units[0].entries[0].problem.problemCode, "a029");
  assert.equal(units.flatMap((unit) => unit.entries).length, 2);
  assert.equal(
    filterCourseUnits("一般課程", units, { level: "invalid", topic: "invalid" })
      .count,
    2,
  );
  assert.equal(filterCourseUnits("一般課程", units, { q: [] }).active, false);
});
