import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { apcsCourseLessons } from "../../src/lib/apcsCourseLessons.ts";
import { apcsIntroProblemCatalog } from "../../src/lib/apcsIntroProblemCatalog.ts";
import { apcsPastExamLessons } from "../../src/lib/apcsPastExamLessons.ts";
import { apcsPastExamSamples } from "../../src/lib/apcsPastExamSamples.ts";

// Run with the existing TS loader. --source accepts a fresh public snapshot,
// but is optional so the regression suite does not depend on a developer cache.
const args = process.argv.slice(2);
const option = (key) => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
const lessons = { ...apcsCourseLessons, ...apcsPastExamLessons };
assert.equal(Object.keys(apcsCourseLessons).length, 9);
assert.equal(Object.keys(apcsPastExamLessons).length, 104);
assert.equal(Object.keys(lessons).length, 113);
const normalize = (s) => s.trim().split(/\s+/).join(" ");
const sources = option("--source")
  ? JSON.parse(readFileSync(option("--source"), "utf8"))
  : [...apcsIntroProblemCatalog, ...Object.entries(apcsPastExamSamples).map(([code, samples]) => ({ code, samples }))];
const selected = option("--code")?.split(",") ?? Object.keys(lessons).sort();
const samples = {};
for (const code of selected) {
  const lesson = lessons[code];
  assert.ok(lesson, `Unknown APCS code: ${code}`);
  assert.equal(lesson.code, code);
  const source = sources.find((p) => p.code === code);
  assert.ok(source?.samples?.length, `${code}: public source missing`);
  samples[code] = source.samples;
  assert.ok(source.samples.some((s) => normalize(s.input) === normalize(lesson.sampleInput)
    && normalize(s.output) === normalize(lesson.sampleOutput)), `${code}: displayed sample differs from source`);
  for (const field of ["goal", "concept", "complexity", "pitfall", "traceLabel", "cpp", "python"]) {
    assert.ok(lesson[field]?.trim(), `${code}: missing ${field}`);
  }
  assert.ok(lesson.explanation.length >= 2 && lesson.trace.length >= 3, `${code}: incomplete lesson`);
  for (const step of lesson.trace) {
    assert.ok(step.title && step.description && step.cells.length && step.variables.length, `${code}: empty trace`);
    assert.ok((step.active ?? []).every((i) => Number.isInteger(i) && i >= 0 && i < step.cells.length), `${code}: trace index`);
  }
}

// These traces changed with the live sample. Compute their numbers independently:
// max of the consumed prefix, and exhaustive subsets of the processed items.
const maximum = apcsCourseLessons.a006;
const values = maximum.sampleInput.split(/\s+/).map(Number);
assert.deepEqual(maximum.trace.map((s) => s.cells), maximum.trace.map(() => values.map(String)));
assert.deepEqual(maximum.trace.map((s) => Object.fromEntries(s.variables).best),
  [values[0], Math.max(...values.slice(0, 2)), Math.max(...values), Math.max(...values)].map(String));
const knapsack = apcsCourseLessons.a029;
const [header, ...rows] = knapsack.sampleInput.split("\n").map((line) => line.split(/\s+/).map(Number));
for (let count = 0; count <= header[0]; ++count) {
  const best = Array.from({ length: header[1] + 1 }, (_, capacity) => {
    let result = 0;
    for (let mask = 0; mask < 2 ** count; ++mask) {
      let weight = 0, value = 0;
      for (let i = 0; i < count; ++i) if (mask & (1 << i)) {
        weight += rows[i][0]; value += rows[i][1];
      }
      if (weight <= capacity) result = Math.max(result, value);
    }
    return String(result);
  });
  assert.deepEqual(knapsack.trace[count].cells, best, `a029 trace after ${count} items`);
}
const digits = apcsPastExamLessons.a455.sampleInput.trim();
const digitSums = [0, 0];
for (let i = 0; i < digits.length; ++i) digitSums[(digits.length - 1 - i) % 2] += Number(digits[i]);
const finalDigits = Object.fromEntries(apcsPastExamLessons.a455.trace.at(-1).variables);
assert.equal(finalDigits.A, String(digitSums[0]));
assert.equal(finalDigits.B, String(digitSums[1]));

const python = option("--python");
assert.ok(python, "Specify --python /path/to/python to execute the independent oracles");
assert.ok(!args.includes("--compile-only") || option("--cxx"), "--compile-only requires --cxx /path/to/compiler");
execFileSync(python, [fileURLToPath(new URL("./check-apcs-tutorial-audit.py", import.meta.url))], {
  input: JSON.stringify({
    lessons: Object.fromEntries(selected.map((code) => [code, lessons[code]])), samples,
    cxx: option("--cxx"), compileOnly: args.includes("--compile-only"),
    tempRoot: option("--temp-root"), stress: args.includes("--stress"),
  }),
  stdio: ["pipe", "inherit", "inherit"], timeout: 1800000,
});
console.log(`APCS traces, source matching and ${selected.length} lesson contracts passed.`);
