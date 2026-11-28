// Cross-repository contract check using responses captured from the real C
// server. This reads fixed fixtures only; it never starts or contacts a sandbox.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseSandboxExecution, compileFailed } from "../src/lib/sandboxProtocol.ts";
import { runVerdict } from "../src/lib/judgeCore.ts";

const directory = process.argv[2];
if (!directory || process.argv.length !== 3) {
  console.error("Usage: node --import ./scripts/ctf-test-loader.mjs scripts/check-sandbox-fixtures.mjs <itouSandbox/test/fixtures/http>");
  process.exitCode = 2;
} else {
  const fixtures = resolve(directory);
  const corpus = JSON.parse(await readFile(resolve(fixtures, "../../../corpus.json"), "utf8"));
  assert.equal(corpus.schema_version, 1);
  assert.equal(corpus.cases.length, 12, "Review the consumer check when changing the captured corpus");
  const expectedVerdicts = {
    exit: "AC", nonzero_exit: "RE", signal: "RE", sigsys: "RE",
    wall_timeout: "TLE", oom_kill: "MLE", compile_failed: "CE",
  };
  for (const example of corpus.cases) {
    assert.match(example.id, /^[a-z0-9-]+$/);
    const raw = JSON.parse(await readFile(resolve(fixtures, `${example.id}.response.json`), "utf8"));
    const execution = parseSandboxExecution(raw);
    assert.equal(execution.compile.cpu_time, null, `${example.id}: compiler CPU is unavailable`);
    assert.equal(execution.compile.memory, null, `${example.id}: compiler memory is unavailable`);
    assert.equal(execution.run.cpu_time, raw.run.cpu_time, `${example.id}: preserve measured CPU`);
    assert.equal(execution.run.memory, raw.run.memory, `${example.id}: preserve measured memory`);
    const expected = expectedVerdicts[example.expected.run_cause];
    assert.ok(expected, `${example.id}: expected verdict must be independently specified`);
    const actual = compileFailed(execution) ? "CE" : runVerdict(
      execution.run, example.request.run_timeout,
      example.request.run_memory_limit ?? 64 * 1024 * 1024,
      example.expected.stdout ?? "",
    );
    assert.equal(actual, expected, `${example.id}: native response must produce the right verdict`);
    console.info(`${example.id}: ${actual}`);
  }
  console.info("12 live-captured sandbox response fixtures passed the OJ consumer contract check.");
}
