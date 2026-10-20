import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
import { getCourseLesson } from "../src/lib/courseLessons.ts";

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
const normalize = (text) =>
  text
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
let sourceMatches = 0;
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
    for (const step of lesson.trace) {
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
  771,
  "Expected 771 distinct known tutorial problems; update coverage baseline explicitly for additions",
);
console.log(
  `Source example matches: ${sourceMatches}/771 (${live ? "fresh live snapshot" : "recorded public catalogs"}). This checks coverage/contracts, not a proof of algorithm correctness.`,
);
console.log(
  "a344 remains a known contradictory source: sample matching is not solution verification.",
);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
