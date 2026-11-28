import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  getCourseLesson,
  getLessonCourseTitles,
} from "../src/lib/courseLessons.ts";
import { getToiTopicForProblem } from "../src/lib/toiCourseCurriculum.ts";
import { toiBeginnerLessons } from "../src/lib/toiBeginnerLessons.ts";

const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
const python = option("--python");
const cxx = option("--cxx");
const compileOnly = args.includes("--compile-only-cxx");
assert.ok(!cxx || python, "Pass --python when checking C++ as well");
assert.ok(!compileOnly || cxx, "--compile-only-cxx needs --cxx");
const title = "TOI 新手組 練習";
const lesson = getCourseLesson(title, "a086");
assert.ok(lesson);
assert.equal(lesson, toiBeginnerLessons.a086);
assert.equal(lesson.code, "a086");
assert.notEqual(
  lesson,
  getToiTopicForProblem("a086").lesson,
  "Do not serve the generic division example as the Tangyuan solution",
);
assert.equal(getCourseLesson(title, "toString"), undefined);
assert.equal(getCourseLesson(title, "a999"), undefined);
assert.ok(getLessonCourseTitles("a086").includes(title));

// Golden public sample from https://oj.itousouta.me/problems/a086 (2026-10-20).
const publicSample = { input: "4\n3 7\n0 2\n8 0\n2 5\n", output: "2 7\n2 6\n" };
assert.equal(lesson.sampleInput, publicSample.input);
assert.equal(lesson.sampleOutput, publicSample.output);
for (const key of [
  "concept",
  "goal",
  "complexity",
  "pitfall",
  "traceLabel",
  "cpp",
  "python",
])
  assert.ok(lesson[key]?.trim(), key);
assert.ok(lesson.explanation.length >= 3);
assert.equal(lesson.trace.length, 6);
const rows = [
  [3, 7],
  [0, 2],
  [8, 0],
  [2, 5],
];
for (const [index, step] of lesson.trace.entries()) {
  assert.ok(
    step.title &&
      step.description &&
      step.cells.length &&
      step.variables.length,
  );
  assert.ok(
    (step.active ?? []).every(
      (cell) => Number.isInteger(cell) && cell >= 0 && cell < step.cells.length,
    ),
  );
  if (index < rows.length) {
    const variables = Object.fromEntries(step.variables);
    assert.equal(variables["已讀人數"], String(index + 1));
    for (const [column, label] of [
      [0, "芝麻需求"],
      [1, "花生需求"],
    ]) {
      assert.equal(
        variables[label],
        String(
          rows.slice(0, index + 1).reduce((sum, row) => sum + row[column], 0),
        ),
      );
    }
  }
}
assert.deepEqual(Object.fromEntries(lesson.trace[4].variables), {
  芝麻盒數: "2",
  花生盒數: "2",
});
assert.deepEqual(Object.fromEntries(lesson.trace[5].variables), {
  芝麻盒數: "2",
  芝麻剩餘: "7",
  花生盒數: "2",
  花生剩餘: "6",
  輸出: "2 7\n2 6",
});

// Independent oracle: buy whole boxes until capacity covers the pooled demand.
// Deliberately do not reuse the lesson's (total + 9) / 10 formula.
function makeCase(people) {
  assert.ok(people.length >= 1 && people.length <= 50);
  for (const person of people)
    assert.ok(
      person.length === 2 &&
        person.every(
          (value) => Number.isInteger(value) && value >= 0 && value <= 50,
        ),
    );
  const output =
    [0, 1]
      .map((column) => {
        const total = people.reduce((sum, person) => sum + person[column], 0);
        let boxes = 0;
        while (boxes * 10 < total) ++boxes;
        assert.ok(boxes === 0 || (boxes - 1) * 10 < total);
        assert.ok(boxes * 10 - total >= 0 && boxes * 10 - total <= 9);
        return `${boxes} ${boxes * 10 - total}`;
      })
      .join("\n") + "\n";
  return {
    input: `${people.length}\n${people.map((person) => person.join(" ")).join("\n")}\n`,
    output,
  };
}
assert.deepEqual(makeCase(rows), publicSample);
const cases = [
  publicSample,
  ...[
    [[0, 0]],
    [[1, 0]],
    [[0, 1]],
    [[10, 20]],
    [[11, 21]],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [0, 10],
      [20, 0],
    ],
    Array.from({ length: 50 }, () => [0, 0]),
    Array.from({ length: 50 }, () => [50, 50]),
    Array.from({ length: 50 }, () => [50, 0]),
    Array.from({ length: 50 }, () => [0, 50]),
  ].map(makeCase),
];
for (let amount = 0; amount <= 50; ++amount)
  cases.push(makeCase([[amount, 50 - amount]]));
let seed = 0xa086;
function random(bound) {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed % bound;
}
for (let trial = 0; trial < 80; ++trial)
  cases.push(
    makeCase(
      Array.from({ length: random(50) + 1 }, () => [random(51), random(51)]),
    ),
  );
console.log(
  `a086 routing, public sample and six animation states validated; ${cases.length - 1} independent oracle cases prepared.`,
);
if (!python) {
  console.log(
    "Program execution not requested. Pass --python and optionally --cxx.",
  );
  process.exit(0);
}

const tempRoot = path.resolve(option("--temp-root") ?? tmpdir());
const directory = cxx
  ? await mkdtemp(path.join(tempRoot, "itouoj-a086-check-"))
  : null;
let executable;
try {
  if (cxx) {
    const source = path.join(directory, "a086.cpp");
    executable = path.join(
      directory,
      process.platform === "win32" ? "a086.exe" : "a086",
    );
    await writeFile(source, lesson.cpp);
    execFileSync(cxx, ["-std=c++17", "-O2", source, "-o", executable], {
      timeout: 180000,
      stdio: "pipe",
    });
  }
  const normalize = (text) => text.replaceAll("\r\n", "\n").trimEnd();
  for (const [index, sample] of cases.entries()) {
    for (const [language, command, commandArgs] of [
      ["Python", python, ["-c", lesson.python]],
      ...(executable && !compileOnly ? [["C++", executable, []]] : []),
    ]) {
      const output = execFileSync(command, commandArgs, {
        input: sample.input,
        encoding: "utf8",
        timeout: 10000,
        maxBuffer: 1024 * 1024,
      });
      assert.equal(
        normalize(output),
        normalize(sample.output),
        `${language} ${index === 0 ? "public sample" : `oracle case ${index}`}`,
      );
    }
  }
  console.log(
    `a086: 1 public sample and ${cases.length - 1} generated oracle cases passed (Python${executable && !compileOnly ? " and C++17" : ""})${compileOnly ? "; C++ compiled only" : ""}.`,
  );
} finally {
  if (
    directory &&
    path.dirname(directory) === tempRoot &&
    path.basename(directory).startsWith("itouoj-a086-check-")
  )
    await rm(directory, { recursive: true, force: true });
}
