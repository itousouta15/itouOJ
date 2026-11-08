import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { apcsCourseLessons } from "../src/lib/apcsCourseLessons.ts";
import { apcsPastExamLessons } from "../src/lib/apcsPastExamLessons.ts";
import { apcsPastExamSamples } from "../src/lib/apcsPastExamSamples.ts";
import { apcsIntroProblemCatalog } from "../src/lib/apcsIntroProblemCatalog.ts";
import { cpeLessons } from "../src/lib/cpeLessons.ts";
import { cpeProblemCatalog } from "../src/lib/cpeProblemCatalog.ts";
import { toiPotentialLessons } from "../src/lib/toiPotentialLessons.ts";
import { toiPotentialProblemCatalog } from "../src/lib/toiPotentialProblemCatalog.ts";
import { toiBeginnerLessons } from "../src/lib/toiBeginnerLessons.ts";
import { toiBeginnerProblemCatalog } from "../src/lib/toiBeginnerProblemCatalog.ts";
import { newProblemLessons } from "../src/lib/newProblemLessons.ts";
import newProblemSource from "./fixtures/new-problem-lessons/source.json" with { type: "json" };
import { getCourseLesson } from "../src/lib/courseLessons.ts";
import {
  getToiTopicForProblem,
  toiCourseTopics,
} from "../src/lib/toiCourseCurriculum.ts";

const args = process.argv.slice(2);
const index = args.indexOf("--source-snapshot");
const snapshot =
  index < 0 ? undefined : JSON.parse(await readFile(args[index + 1], "utf8"));
const live = snapshot
  ? new Map(snapshot.map((problem) => [problem.code, problem]))
  : undefined;
const archiveCatalog = Object.entries(apcsPastExamSamples).map(
  ([code, samples]) => ({ code, samples }),
);
const groups = [
  { name: "Competition and topic practice", lessons: newProblemLessons, catalog: newProblemSource.problems, count: 876 },
  {
    name: "APCS introductory",
    title: "APCS 實作題：由簡到難",
    lessons: apcsCourseLessons,
    catalog: apcsIntroProblemCatalog,
    count: 9,
  },
  {
    name: "APCS archived",
    title: "APCS 歷屆",
    lessons: apcsPastExamLessons,
    catalog: archiveCatalog,
    count: 104,
  },
  {
    name: "TOI beginner",
    title: "TOI 新手組 練習",
    lessons: toiBeginnerLessons,
    catalog: toiBeginnerProblemCatalog,
    count: 135,
  },
  {
    name: "TOI potential",
    lessons: toiPotentialLessons,
    catalog: toiPotentialProblemCatalog,
    count: 135,
  },
  { name: "CPE", lessons: cpeLessons, catalog: cpeProblemCatalog, count: 388 },
];
const failures = [];
const allCodes = new Set();
const registry = new Map();
const beginnerTopicCodes = toiCourseTopics.flatMap((topic) => topic.codes);
assert.equal(
  new Set(beginnerTopicCodes).size,
  beginnerTopicCodes.length,
  "Beginner topic groups must not duplicate problem ids",
);
assert.deepEqual(
  [...beginnerTopicCodes].sort(),
  toiBeginnerProblemCatalog.map((p) => p.code).sort(),
  "Every real beginner problem must have exactly one topic home",
);
for (const lesson of Object.values(toiBeginnerLessons))
  assert.equal(
    getToiTopicForProblem(lesson.code)?.id,
    lesson.topic,
    `${lesson.code}: topic must follow the authored algorithm`,
  );
const normalize = (text) =>
  text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
let sourceMatches = 0;
let publicExamples = 0;
let constructedExamples = 0;
for (const group of groups) {
  const expected = group.catalog.map((problem) => problem.code).sort();
  const actual = Object.keys(group.lessons).sort();
  if (expected.length !== group.count)
    failures.push(
      `${group.name}: expected catalog count ${group.count}, got ${expected.length}`,
    );
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    failures.push(
      `${group.name}: missing or unexpected lesson ids: ${expected.filter((code) => !actual.includes(code)).join(" ")} / ${actual.filter((code) => !expected.includes(code)).join(" ")}`,
    );
  for (const problem of group.catalog) {
    const code = problem.code;
    allCodes.add(code);
    const lesson = group.lessons[code];
    if (!lesson) {
      failures.push(`${code}: missing problem-specific lesson`);
      continue;
    }
    registry.set(code, lesson);
    if (lesson.code !== code)
      failures.push(`${code}: lesson belongs to ${lesson.code}`);
    if (group.title && getCourseLesson(group.title, code) !== lesson)
      failures.push(
        `${code}: course resolver does not return its exact lesson`,
      );
    for (const field of [
      "concept",
      "goal",
      "complexity",
      "pitfall",
      "traceLabel",
      "cpp",
      "python",
    ])
      if (typeof lesson[field] !== "string" || !lesson[field].trim())
        failures.push(`${code}: missing ${field}`);
    if (lesson.explanation.length < 2 || lesson.trace.length < 3)
      failures.push(`${code}: incomplete explanation or trace`);
    if (
      new Set(lesson.trace.map((step) => step.title)).size !==
      lesson.trace.length
    )
      failures.push(`${code}: duplicate animation step keys`);
    for (const step of lesson.trace) {
      if (
        new Set(step.variables.map(([name]) => name)).size !==
        step.variables.length
      )
        failures.push(`${code}: duplicate animation variable keys`);
      if (
        !step.title ||
        !step.description ||
        !step.cells.length ||
        !step.variables.length ||
        (step.active ?? []).some(
          (i) => !Number.isInteger(i) || i < 0 || i >= step.cells.length,
        )
      )
        failures.push(`${code}: invalid animation state`);
    }
    const source = live?.get(code) ?? problem;
    if (live && !live.has(code))
      failures.push(`${code}: missing current source snapshot`);
    if (source.samples.length === 0 && lesson.exampleKind === "constructed") {
      if (!lesson.sampleOutput.trim()) failures.push(`${code}: empty constructed teaching output`);
      else ++constructedExamples;
      continue;
    }
    ++publicExamples;
    const sampleMatch = source.samples.some(
      (sample) =>
        normalize(sample.input) === normalize(lesson.sampleInput) &&
        normalize(sample.output) === normalize(lesson.sampleOutput),
    );
    if (!sampleMatch)
      failures.push(
        `${code}: displayed example does not match ${live ? "current live" : "recorded public"} source`,
      );
    else ++sourceMatches;
  }
  for (const invalid of ["a999", "toString", "constructor", "__proto__"]) {
    if (group.title && getCourseLesson(group.title, invalid) !== undefined)
      failures.push(`${group.name}: advertised nonexistent ${invalid}`);
  }
  console.log(
    `${group.name}: ${actual.length}/${group.count} exact-id tutorials present`,
  );
}
assert.equal(
  allCodes.size,
  1647,
  "Expected 1647 distinct known tutorial problems; update coverage baseline explicitly for additions",
);
console.log(
  `Source example matches: ${sourceMatches}/${publicExamples} (${live ? "fresh live snapshot" : "recorded public catalogs"}); ${constructedExamples} explicitly labeled teaching examples for questions without public examples. This checks coverage/contracts, not a proof of algorithm correctness.`,
);
console.log(
  "a344 remains a known contradictory source: sample matching is not solution verification.",
);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  const output = args.indexOf("--registry-output");
  if (output >= 0) {
    assert.ok(args[output + 1], "--registry-output needs a JSON path");
    await writeFile(args[output + 1], JSON.stringify([...registry.values()], null, 2) + "\n");
  }
}
