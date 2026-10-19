import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { apcsPastExamSamples } from "../src/lib/apcsPastExamSamples.ts";

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
};
const batch = option("--batch");
const only = option("--code");
let lessons;
if (batch) {
  assert.match(batch, /^part[1-6]$/);
  const content = await import(`../src/lib/apcsPastExamBatches/${batch}.ts`);
  lessons = Object.values(content)[0];
} else {
  const { apcsPastExamLessons } = await import("../src/lib/apcsPastExamLessons.ts");
  const { apcsPastExamUnits } = await import("../src/lib/apcsPastExamCourse.ts");
  lessons = Object.values(apcsPastExamLessons);
  const expected = Array.from({ length: 104 }, (_, i) => `a${356 + i}`);
  if (!only) assert.deepEqual(Object.keys(apcsPastExamLessons).sort(), expected, "Every archived problem needs a lesson");
  const curriculum = apcsPastExamUnits.flatMap((unit) => unit.codes);
  if (!only) {
    assert.equal(new Set(curriculum).size, 104, "Curriculum must not duplicate problems");
    assert.deepEqual([...curriculum].sort(), expected, "Curriculum must contain all lessons");
  }
}
if (only) {
  const selected = new Set(only.split(","));
  lessons = lessons.filter((lesson) => selected.has(lesson.code));
  assert.equal(lessons.length, selected.size, "Requested lesson missing");
}
assert.ok(lessons.length, "No lessons selected");
const normalize = (text) => text.trim().split(/\s+/).join(" ");
async function runProgram(command, commandArgs, options) {
  // Windows may briefly lock a freshly linked executable while scanning it.
  // Retry launch failures only, never runtime errors or incorrect outputs.
  for (let attempt = 0; ; ++attempt) {
    try { return execFileSync(command, commandArgs, options); }
    catch (error) {
      if (process.platform !== "win32" || !["UNKNOWN", "EACCES", "EBUSY"].includes(error.code) || attempt >= 5) throw error;
      await new Promise((done) => setTimeout(done, 500 * (attempt + 1)));
    }
  }
}
const python = option("--python");
const cxx = option("--cxx");
const tempRoot = path.resolve(option("--temp-root") ?? tmpdir());
const temp = cxx ? await mkdtemp(path.join(tempRoot, "itouoj-apcs-")) : undefined;
// GNU's convenience header is not shipped with MSVC's standard library.
// Expand it into standard headers when validating with clang-cl/clang++ on Windows.
const standardHeaders = ["algorithm", "array", "bitset", "cassert", "cmath", "climits", "cstdint", "cstdio", "cstdlib", "cstring", "deque", "functional", "iomanip", "iostream", "iterator", "limits", "list", "map", "numeric", "optional", "queue", "set", "sstream", "stack", "string", "tuple", "unordered_map", "unordered_set", "utility", "vector"]
  .map((header) => `#include <${header}>`).join("\n");
let sampleCount = 0;
try {
  for (const lesson of lessons) {
    const samples = apcsPastExamSamples[lesson.code];
    assert.ok(samples?.length, `${lesson.code}: public samples missing`);
    assert.ok(samples.some((sample) => normalize(sample.input) === normalize(lesson.sampleInput)
      && normalize(sample.output) === normalize(lesson.sampleOutput)), `${lesson.code}: displayed example differs from public samples`);
    for (const field of ["concept", "goal", "complexity", "pitfall", "traceLabel", "cpp", "python"]) {
      assert.ok(lesson[field]?.trim(), `${lesson.code}: missing ${field}`);
    }
    assert.ok(lesson.explanation.length >= 2, `${lesson.code}: derivation missing`);
    assert.ok(lesson.trace.length >= 3, `${lesson.code}: animation incomplete`);
    for (const step of lesson.trace) {
      assert.ok(step.title && step.description && step.cells.length && step.variables.length, `${lesson.code}: empty animation state`);
      assert.ok((step.active ?? []).every((index) => Number.isInteger(index) && index >= 0 && index < step.cells.length), `${lesson.code}: animation points outside its cells`);
    }
    let executable;
    if (cxx) {
      const source = path.join(temp, `${lesson.code}.cpp`);
      executable = path.join(temp, `${lesson.code}${process.platform === "win32" ? ".exe" : ""}`);
      const code = process.platform === "win32"
        ? lesson.cpp.replace(/#include\s*<bits\/stdc\+\+\.h>/g, standardHeaders)
        : lesson.cpp;
      await writeFile(source, code);
      execFileSync(cxx, ["-std=c++17", "-O2", source, "-o", executable], { timeout: 180000, stdio: "pipe" });
    }
    for (const [index, sample] of samples.entries()) {
      for (const [language, command, commandArgs] of [
        ["Python", python, ["-c", lesson.python]],
        ["C++", executable, []],
      ]) {
        if (!command) continue;
        const actual = await runProgram(command, commandArgs, { input: sample.input, encoding: "utf8", timeout: 15000, maxBuffer: 8 * 1024 * 1024 });
        assert.equal(normalize(actual), normalize(sample.output), `${lesson.code} ${language} sample ${index + 1}`);
      }
      ++sampleCount;
    }
    console.log(`${lesson.code}: ${samples.length} samples ${python || cxx ? "passed" : "available"}${python ? " (Python)" : ""}${cxx ? " (C++)" : ""}`);
  }
} finally {
  if (temp && path.dirname(temp) === tempRoot && path.basename(temp).startsWith("itouoj-apcs-")) {
    await rm(temp, { recursive: true, force: true });
  }
}
console.log(`Validated ${lessons.length} lesson structures and ${sampleCount} public samples.${python || cxx ? "" : " Program execution not requested."}`);
