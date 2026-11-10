import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const batches = ["competition", "national1", "national2", "practice1", "practice2", "practice3", "practice4", "nov08-562-607", "nov08-608-653", "nov08-654-699", "nov08-700-745", "nov08-746-790"];
const root = new URL("../", import.meta.url);
const read = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const snapshot = await read("scripts/fixtures/new-problem-lessons/source.json");
const sources = new Map(snapshot.problems.map((p) => [p.code, p]));
const args = process.argv.slice(2);
const option = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
const selected = option("--batch");
assert.ok(!selected || batches.includes(selected), "Unknown batch");
const topics = new Set(["basics", "simulation", "strings", "search", "sorting", "greedy", "dp", "graphs", "trees", "number-theory", "geometry", "data-structures"]);
const normalize = (value) => value.replaceAll("\r\n", "\n").split("\n").map((line) => line.trimEnd()).join("\n").trimEnd();
const lessons = [];
let customCases = 0;
for (const batch of selected ? [selected] : batches) {
  const data = await read(`src/lib/newProblemLessons/data/${batch}.json`);
  const checks = await read(batch.startsWith("nov08-") ? `scripts/fixtures/nov08-new-problems/checks-${batch.slice(6)}.json` : `scripts/fixtures/new-problem-lessons/${batch}-checks.json`);
  assert.ok(Array.isArray(data) && Array.isArray(checks));
  if (batch.startsWith("nov08-")) {
    const [, start, end] = /^nov08-(\d+)-(\d+)$/.exec(batch);
    const expected = Array.from({ length: Number(end) - Number(start) + 1 }, (_, i) => `b${Number(start) + i}`);
    assert.deepEqual(data.map((lesson) => lesson.code).sort(), expected, `${batch}: incomplete or misassigned range`);
  }
  for (const lesson of data) {
    const source = sources.get(lesson.code);
    assert.ok(source, `Unknown source ${lesson.code}`);
    assert.equal(lesson.title, source.title.replace(new RegExp(`^${lesson.code}\\.\\s*`), ""), `${lesson.code}: title must identify the actual problem`);
    assert.ok(topics.has(lesson.topic), `${lesson.code}: topic`);
    assert.ok(["easy", "medium", "hard"].includes(lesson.level));
    for (const field of ["concept", "goal", "complexity", "pitfall", "traceLabel", "cpp", "python"])
      assert.ok(typeof lesson[field] === "string" && lesson[field].trim().length > 0, `${lesson.code}: missing ${field}`);
    assert.ok(lesson.explanation.length >= 2 && lesson.explanation.every((p) => typeof p === "string" && p.length > 10));
    assert.doesNotMatch([lesson.goal, ...lesson.explanation, lesson.pitfall].join("\n"), /TODO|待補教學|尚未撰寫|之後補上/);
    if (source.samples.length) {
      assert.notEqual(lesson.exampleKind, "constructed", `${lesson.code}: retain the existing public example`);
      assert.equal(normalize(lesson.sampleInput), normalize(source.samples[0].input), `${lesson.code}: sample input`);
      assert.equal(normalize(lesson.sampleOutput), normalize(source.samples[0].output), `${lesson.code}: sample output`);
    } else {
      assert.equal(lesson.exampleKind, "constructed", `${lesson.code}: absent public samples require an explicitly labeled teaching example`);
      assert.ok(lesson.sampleOutput.trim(), `${lesson.code}: the teaching example must have a computed output`);
      assert.ok(checks.some((check) => check.code === lesson.code && normalize(check.input) === normalize(lesson.sampleInput) && normalize(check.output) === normalize(lesson.sampleOutput)), `${lesson.code}: constructed example must be independently verified`);
    }
    assert.ok(lesson.trace.length >= 3, `${lesson.code}: authored trace required`);
    for (const step of lesson.trace) {
      assert.ok(step.title && step.description && Array.isArray(step.cells) && step.cells.length > 0);
      assert.ok((step.active ?? []).every((i) => Number.isInteger(i) && i >= 0 && i < step.cells.length), `${lesson.code}: invalid trace highlight`);
      assert.ok(Array.isArray(step.variables) && step.variables.every((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((x) => typeof x === "string")));
    }
    const independent = checks.filter((check) => check.code === lesson.code);
    assert.ok(independent.length > 0, `${lesson.code}: independent boundary/oracle case required`);
    for (const check of independent) {
      assert.ok(typeof check.input === "string" && typeof check.output === "string" && check.reason, `${lesson.code}: malformed oracle case`);
      const fixedNoInput = source.fixedNoInput === true && source.fixedNoInputReason && /沒有輸入|無輸入/.test(source.statement) && source.samples.every((sample) => sample.input === "") && check.input === "";
      assert.ok(fixedNoInput || !source.samples.some((sample) => normalize(sample.input) === normalize(check.input)), `${lesson.code}: duplicated public sample does not count as independent verification`);
    }
    customCases += independent.length;
    lessons.push({ ...lesson, samples: source.samples, checks: independent });
  }
  assert.ok(checks.every((check) => data.some((lesson) => lesson.code === check.code)), `${batch}: orphan check`);
}
assert.equal(new Set(lessons.map((l) => l.code)).size, lessons.length, "Duplicate problem ids");
if (!selected) assert.deepEqual(lessons.map((l) => l.code).sort(), [...sources.keys()].sort(), "Every newly discovered public question needs its own verified tutorial");
console.log(`Authored tutorials: ${lessons.length}; public samples: ${lessons.reduce((n,l) => n+l.samples.length,0)}; independent cases: ${customCases}.`);

if (args.includes("--runtime")) {
  const requestedCodes = option("--codes")?.split(",").filter(Boolean);
  if (requestedCodes) assert.ok(requestedCodes.every((code) => lessons.some((lesson) => lesson.code === code)), "--codes must refer to authored lessons in the selected batch");
  const runtimeLessons = requestedCodes ? lessons.filter((lesson) => requestedCodes.includes(lesson.code)) : lessons;
  const helper = fileURLToPath(new URL("./lib/check-new-problem-lessons.py", import.meta.url));
  let command, commandArgs;
  if (process.platform === "win32") {
    // Generate and run Linux binaries only. No Windows compiler fallback.
    const linux = "/mnt/" + helper[0].toLowerCase() + helper.slice(2).replaceAll("\\", "/");
    command = "wsl.exe";
    commandArgs = ["-d", "kali-linux", "--exec", "python3", linux];
  } else {
    command = process.env.PYTHON || "python3";
    commandArgs = [helper];
  }
  const result = spawnSync(command, commandArgs, { input: JSON.stringify(runtimeLessons), encoding: "utf8", stdio: ["pipe", "pipe", "inherit"], timeout: 1_800_000, maxBuffer: 8_000_000 });
  process.stdout.write((result.stdout || "").split("\n").filter((line) => !line.startsWith("REPORT_JSON=")).join("\n"));
  assert.ifError(result.error);
  const line = result.stdout?.split("\n").find((line) => line.startsWith("REPORT_JSON="));
  const runtimeReport = line ? JSON.parse(line.slice("REPORT_JSON=".length)) : undefined;
  if (runtimeReport) console.log(`Runtime: ${runtimeReport.tutorials} tutorials, ${runtimeReport.publicSamplesPerLanguage} public samples and ${runtimeReport.independentCasesPerLanguage} independent cases per language; ${runtimeReport.failures.length} failures.`);
  const report = option("--report");
  if (report) {
    assert.ok(line, "Runtime helper did not produce a verification report: " + (result.stderr || result.stdout || "").slice(-4000));
    await writeFile(report, JSON.stringify(runtimeReport, null, 2) + "\n");
  }
  assert.equal(result.status, 0, result.stderr || JSON.stringify(runtimeReport?.failures ?? result.stdout));
}
