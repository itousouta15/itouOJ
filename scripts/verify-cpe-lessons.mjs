import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cpeProblemCatalog } from "../src/lib/cpeProblemCatalog.ts";
import { cpeTopics } from "../src/lib/cpeLessonTypes.ts";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const file = option("--file");
const batch = option("--batch");
const only = option("--code");
const expectedCodes = Array.from(
  { length: 388 },
  (_, index) => `a${460 + index}`,
);
assert.deepEqual(
  cpeProblemCatalog.map((entry) => entry.code),
  expectedCodes,
  "CPE public catalog must cover a460–a847 exactly",
);
let lessons;
if (file) {
  assert.match(file, /^(final|batch[1-6]\/part[1-4])$/);
  lessons = (await import(`../src/lib/cpeLessons/${file}.ts`)).lessons;
} else if (batch) {
  assert.match(batch, /^[1-6]$/);
  lessons = [];
  for (let part = 1; part <= 4; ++part) {
    lessons.push(
      ...(await import(`../src/lib/cpeLessons/batch${batch}/part${part}.ts`))
        .lessons,
    );
  }
} else {
  const { cpeLessons } = await import("../src/lib/cpeLessons.ts");
  lessons = Object.values(cpeLessons);
  if (!only)
    assert.deepEqual(
      Object.keys(cpeLessons).sort(),
      cpeProblemCatalog.map((entry) => entry.code),
      "Every CPE problem needs exactly one lesson",
    );
}
if (only) {
  const codes = new Set(only.split(","));
  lessons = lessons.filter((lesson) => codes.has(lesson.code));
  assert.equal(lessons.length, codes.size, "Requested lesson missing");
}
assert.ok(lessons.length, "No lessons selected");
if (!only && file) {
  const match = /^batch([1-6])\/part([1-4])$/.exec(file);
  const start = match
    ? 460 + (Number(match[1]) - 1) * 64 + (Number(match[2]) - 1) * 16
    : 844;
  const count = match ? 16 : 4;
  assert.deepEqual(
    lessons.map((lesson) => lesson.code).sort(),
    Array.from({ length: count }, (_, index) => `a${start + index}`),
    "Content file has missing or misplaced lessons",
  );
}
if (!only && batch) {
  const start = 460 + (Number(batch) - 1) * 64;
  assert.deepEqual(
    lessons.map((lesson) => lesson.code).sort(),
    Array.from({ length: 64 }, (_, index) => `a${start + index}`),
    "Content batch must contain all 64 assigned lessons",
  );
}
assert.equal(
  new Set(lessons.map((lesson) => lesson.code)).size,
  lessons.length,
  "Duplicate CPE lessons",
);
const topics = new Set(cpeTopics.map((topic) => topic.id));
const catalog = new Map(
  cpeProblemCatalog.map((problem) => [problem.code, problem]),
);
for (const lesson of lessons) {
  assert.ok(topics.has(lesson.topic), `${lesson.code}: invalid topic`);
  assert.ok(
    ["easy", "medium", "hard"].includes(lesson.level),
    `${lesson.code}: invalid level`,
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
    assert.ok(lesson[field]?.trim(), `${lesson.code}: missing ${field}`);
  assert.ok(
    lesson.explanation.length >= 2,
    `${lesson.code}: missing derivation`,
  );
  assert.ok(lesson.trace.length >= 3, `${lesson.code}: incomplete animation`);
  for (const step of lesson.trace) {
    assert.ok(
      step.title &&
        step.description &&
        step.cells.length &&
        step.variables.length,
      `${lesson.code}: empty animation state`,
    );
    assert.ok(
      (step.active ?? []).every(
        (index) =>
          Number.isInteger(index) && index >= 0 && index < step.cells.length,
      ),
      `${lesson.code}: invalid active cell`,
    );
  }
  assert.ok(
    catalog
      .get(lesson.code)
      ?.samples.some(
        (sample) =>
          sample.input === lesson.sampleInput &&
          sample.output === lesson.sampleOutput,
      ),
    `${lesson.code}: displayed example differs from saved public examples`,
  );
}
console.log(`Validated ${lessons.length} CPE lesson structures.`);
const python = option("--python");
const cxx = option("--cxx");
assert.ok(
  !cxx || python,
  "--cxx requires --python for the portable subprocess runner",
);
if (python) {
  const runnerArgs = [
    fileURLToPath(new URL("./lib/check-cpe-programs.py", import.meta.url)),
  ];
  if (cxx) runnerArgs.push("--cxx", cxx);
  if (option("--temp-root"))
    runnerArgs.push("--temp-root", option("--temp-root"));
  if (args.includes("--no-pch")) runnerArgs.push("--no-pch");
  if (args.includes("--compile-only-cxx"))
    runnerArgs.push("--compile-only-cxx");
  execFileSync(python, runnerArgs, {
    input: JSON.stringify(
      lessons.map((lesson) => ({
        ...lesson,
        samples: catalog.get(lesson.code).samples,
      })),
    ),
    stdio: ["pipe", "inherit", "inherit"],
    timeout: 3600000,
  });
} else {
  console.log(
    "Program execution not requested. Pass --python and optionally --cxx to execute public examples.",
  );
}
