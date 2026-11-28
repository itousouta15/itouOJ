import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const argv = process.argv.slice(2);
const onlyNov08 = argv.includes("--nov08-only");
const batches = ["competition", "national1", "national2", "practice1", "practice2", "practice3", "practice4", "nov08-562-607", "nov08-608-653", "nov08-654-699", "nov08-700-745", "nov08-746-790"].filter((batch) => !onlyNov08 || batch.startsWith("nov08-"));
const read = async (file) => JSON.parse(await readFile(file, "utf8"));
const hash = (text) => createHash("sha256").update(text).digest("hex");
const sources = new Map((await read(new URL("./fixtures/new-problem-lessons/source.json", import.meta.url))).problems.filter((p) => !onlyNov08 || /^b\d+$/.test(p.code) && Number(p.code.slice(1)) >= 562 && Number(p.code.slice(1)) <= 790).map((p) => [p.code, p]));
if (onlyNov08) assert.equal(sources.size, 229, "Expected exactly the Nov8 additions b562-b790");
const current = new Map();
for (const batch of batches) {
  const data = await read(new URL(`../src/lib/newProblemLessons/data/${batch}.json`, import.meta.url));
  const checks = await read(new URL(batch.startsWith("nov08-") ? `./fixtures/nov08-new-problems/checks-${batch.slice(6)}.json` : `./fixtures/new-problem-lessons/${batch}-checks.json`, import.meta.url));
  for (const lesson of data) current.set(lesson.code, { ...lesson, samples: sources.get(lesson.code).samples, checks: checks.filter((c) => c.code === lesson.code) });
}
const paths = argv.filter((arg) => arg !== "--nov08-only");
assert.ok(paths.length > 0, "Supply per-batch runtime reports and any incremental re-verification reports");
const verified = new Set();
let samples = 0, independent = 0, staleEvidenceIgnored = 0;
for (const path of paths) {
  const report = await read(path);
  assert.deepEqual(report.failures, [], path);
  assert.equal(report.platform, "linux", "C++ runtime evidence must come from Linux");
  assert.equal(report.tutorials, report.programs.length);
  for (const result of report.programs) {
    assert.equal(result.status, "pass", result.code);
    const lesson = current.get(result.code);
    assert.ok(lesson, `Unknown reported lesson ${result.code}`);
    const digest = createHash("sha256");
    for (const kind of ["samples", "checks"]) {
      digest.update(kind);
      for (const check of lesson[kind]) for (const field of ["input", "output"]) {
        const data = Buffer.from(check[field]);
        const size = Buffer.alloc(8); size.writeBigUInt64BE(BigInt(data.length));
        digest.update(size); digest.update(data);
      }
    }
    if (result.cppSha256 !== hash(lesson.cpp) || result.pythonSha256 !== hash(lesson.python) || result.casesSha256 !== digest.digest("hex")) {
      ++staleEvidenceIgnored;
      continue;
    }
    if (verified.has(result.code)) continue;
    assert.equal(result.publicSamples, lesson.samples.length);
    assert.equal(result.independentCases, lesson.checks.length);
    verified.add(result.code); samples += result.publicSamples; independent += result.independentCases;
  }
}
assert.deepEqual([...verified].sort(), [...sources.keys()].sort(), "Missing runtime verification for a new problem");
console.log(JSON.stringify({ scope: onlyNov08 ? "b562-b790 additions" : "all competition/topic tutorials", tutorials: verified.size, publicSamplesPerLanguage: samples, independentCasesPerLanguage: independent, languages: ["C++17", "Python3"], sourceAndCaseHashesMatchCurrentFiles: true, staleEvidenceIgnored }, null, 2));
