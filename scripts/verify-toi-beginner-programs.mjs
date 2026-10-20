import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { toiBeginnerLessons } from "../src/lib/toiBeginnerLessons.ts";
import { toiBeginnerProblemCatalog } from "../src/lib/toiBeginnerProblemCatalog.ts";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const only = option("--code");
const codes = only
  ? only.split(",")
  : toiBeginnerProblemCatalog.map((problem) => problem.code);
if (!only)
  assert.deepEqual(
    Object.keys(toiBeginnerLessons).sort(),
    [...codes].sort(),
    "Every beginner problem must have its own lesson; generic topic demos are not accepted",
  );
const allowedTopics = new Set([
  "read-calculate",
  "conditions",
  "count-frequency",
  "text",
  "arrays",
  "grid",
  "simulation",
  "number-theory",
  "search-optimization",
]);
const selected = codes.map((code) => {
  const lesson = toiBeginnerLessons[code];
  const problem = toiBeginnerProblemCatalog.find((item) => item.code === code);
  assert.ok(lesson && problem, `Missing ${code}`);
  assert.equal(lesson.code, code);
  assert.ok(allowedTopics.has(lesson.topic), `${code}: invalid topic`);
  assert.ok(
    problem.samples.some(
      (sample) =>
        sample.input === lesson.sampleInput &&
        sample.output === lesson.sampleOutput,
    ),
    `${code}: example is not from the source problem`,
  );
  assert.ok(
    lesson.explanation.length >= 2 && lesson.trace.length >= 3,
    `${code}: incomplete derivation/animation`,
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
    assert.ok(lesson[field]?.trim(), `${code}: missing ${field}`);
  for (const step of lesson.trace)
    assert.ok(
      step.title &&
        step.description &&
        step.cells.length &&
        step.variables.length &&
        (step.active ?? []).every(
          (index) =>
            Number.isInteger(index) && index >= 0 && index < step.cells.length,
        ),
      `${code}: invalid trace`,
    );
  return { ...lesson, samples: problem.samples };
});
console.log(
  `Validated ${selected.length} exact problem-specific beginner lessons against their public samples.`,
);
const python = option("--python"),
  cxx = option("--cxx");
assert.ok(!cxx || python, "--cxx requires --python");
if (python) {
  const runnerArgs = [
    fileURLToPath(new URL("./lib/check-cpe-programs.py", import.meta.url)),
  ];
  if (cxx) runnerArgs.push("--cxx", cxx);
  if (option("--temp-root"))
    runnerArgs.push("--temp-root", option("--temp-root"));
  for (const flag of ["--no-pch", "--compile-only-cxx"])
    if (args.includes(flag)) runnerArgs.push(flag);
  execFileSync(python, runnerArgs, {
    input: JSON.stringify(selected),
    stdio: ["pipe", "inherit", "inherit"],
    timeout: 1800000,
  });
} else
  console.log(
    "Program execution not requested; use --python and optionally --cxx.",
  );
