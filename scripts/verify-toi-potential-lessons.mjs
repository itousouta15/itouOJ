import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { toiPotentialProblemCatalog } from "../src/lib/toiPotentialProblemCatalog.ts";
import { toiPotentialTopics } from "../src/lib/toiPotentialLessonTypes.ts";
import { toiPotentialSourceIssues } from "../src/lib/toiPotentialSourceIssues.ts";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const file = option("--file");
const batch = option("--batch");
const only = option("--code");
const checkKnownConflicts = args.includes("--check-known-source-conflicts");
assert.deepEqual(
  Object.keys(toiPotentialSourceIssues),
  ["a344"],
  "New source conflicts require explicit review",
);
assert.ok(!(file && batch), "Choose --file or --batch, not both");
const expectedCodes = [
  ...Array.from({ length: 48 }, (_, index) => `a${108 + index}`),
  ...Array.from({ length: 87 }, (_, index) => `a${269 + index}`),
];
assert.deepEqual(
  toiPotentialProblemCatalog.map((entry) => entry.code),
  expectedCodes,
  "TOI potential catalog must contain a108–a155 and a269–a355 exactly",
);
assert.ok(
  toiPotentialProblemCatalog.every(
    (problem) =>
      problem.title.includes("潛力組") &&
      problem.samples.length > 0 &&
      problem.samples.every(
        (sample) =>
          typeof sample.input === "string" && typeof sample.output === "string",
      ),
  ),
  "Every catalogued problem needs its own title and public samples",
);
let lessons;
let selectedCodes = expectedCodes;
if (file) {
  assert.match(file, /^(final|batch[1-6]\/part[1-2])$/);
  lessons = (await import(`../src/lib/toiPotentialLessons/${file}.ts`)).lessons;
  const match = /^batch([1-6])\/part([1-2])$/.exec(file);
  const start = match
    ? (Number(match[1]) - 1) * 22 + (Number(match[2]) - 1) * 11
    : 132;
  selectedCodes = expectedCodes.slice(start, start + (match ? 11 : 3));
} else if (batch) {
  assert.match(batch, /^[1-6]$/);
  lessons = [];
  for (let part = 1; part <= 2; part++) {
    lessons.push(
      ...(
        await import(
          `../src/lib/toiPotentialLessons/batch${batch}/part${part}.ts`
        )
      ).lessons,
    );
  }
  const start = (Number(batch) - 1) * 22;
  selectedCodes = expectedCodes.slice(start, start + 22);
} else {
  const { toiPotentialLessons } =
    await import("../src/lib/toiPotentialLessons.ts");
  lessons = Object.values(toiPotentialLessons);
}
if (only) {
  const codes = new Set(only.split(","));
  assert.ok(
    [...codes].every((code) => selectedCodes.includes(code)),
    "Requested code is outside selected batch",
  );
  lessons = lessons.filter((lesson) => codes.has(lesson.code));
  selectedCodes = [...codes].sort();
}
assert.deepEqual(
  lessons.map((lesson) => lesson.code).sort(),
  selectedCodes,
  "Selected file/batch has missing, duplicated or misplaced lessons",
);
const topics = new Set(toiPotentialTopics.map((topic) => topic.id));
const catalog = new Map(
  toiPotentialProblemCatalog.map((problem) => [problem.code, problem]),
);
for (const lesson of lessons) {
  assert.ok(topics.has(lesson.topic), `${lesson.code}: invalid topic`);
  assert.ok(
    ["easy", "medium", "hard"].includes(lesson.level),
    `${lesson.code}: invalid difficulty`,
  );
  for (const field of [
    "concept",
    "goal",
    "complexity",
    "pitfall",
    "traceLabel",
    "cpp",
    "python",
  ]) {
    assert.ok(
      typeof lesson[field] === "string" && lesson[field].trim(),
      `${lesson.code}: missing ${field}`,
    );
  }
  assert.ok(
    lesson.explanation.length >= 2 &&
      lesson.explanation.every((paragraph) => paragraph.trim()),
    `${lesson.code}: incomplete derivation`,
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
      step.cells.every((cell) => typeof cell === "string") &&
        step.variables.every(
          (pair) =>
            pair.length === 2 &&
            pair.every((value) => typeof value === "string"),
        ),
      `${lesson.code}: invalid cell or variable`,
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
    `${lesson.code}: displayed sample differs from public catalog`,
  );
}
console.log(`Validated ${lessons.length} TOI potential lesson structures.`);
const diagnosed = lessons.filter(
  (lesson) => toiPotentialSourceIssues[lesson.code],
);
for (const lesson of diagnosed) {
  console.log(
    `${lesson.code}: known source contradiction, not a fully sample-verified solution.`,
  );
}
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
  const verified = checkKnownConflicts
    ? lessons.filter((lesson) => !toiPotentialSourceIssues[lesson.code])
    : lessons;
  if (verified.length)
    execFileSync(python, runnerArgs, {
      input: JSON.stringify(
        verified.map((lesson) => ({
          ...lesson,
          samples: catalog.get(lesson.code).samples,
        })),
      ),
      stdio: ["pipe", "inherit", "inherit"],
      timeout: 3600000,
    });
  if (checkKnownConflicts && diagnosed.length) {
    const conflictArgs = [
      fileURLToPath(
        new URL("./lib/check-toi-source-conflicts.py", import.meta.url),
      ),
    ];
    if (cxx) conflictArgs.push("--cxx", cxx);
    if (option("--temp-root"))
      conflictArgs.push("--temp-root", option("--temp-root"));
    if (args.includes("--compile-only-cxx"))
      conflictArgs.push("--compile-only-cxx");
    execFileSync(python, conflictArgs, {
      input: JSON.stringify(
        diagnosed.map((lesson) => ({
          lesson,
          samples: catalog.get(lesson.code).samples,
          issue: toiPotentialSourceIssues[lesson.code],
        })),
      ),
      stdio: ["pipe", "inherit", "inherit"],
      timeout: 300000,
    });
  }
} else {
  console.log(
    "Program execution not requested. Pass --python and optionally --cxx for public examples.",
  );
}
