import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { EditorState } from "@codemirror/state";
import { CompletionContext } from "@codemirror/autocomplete";
import { ensureSyntaxTree } from "@codemirror/language";
import { loadEditorLanguage } from "../src/lib/editorLanguages.ts";
import { EDITOR_COMPLETIONS } from "../src/lib/editorCompletions.ts";
import { ITOULANG_SUBMISSION_TEMPLATE, ITOULANG_PLAYGROUND_TEMPLATE } from "../src/lib/itoulangTemplates.ts";

const runtime = new URL("../vendor/itoulang/src/wasm-transport.js", import.meta.url);
assert.ok(existsSync(new URL("../vendor/itoulang/web/native/itou.wasm", import.meta.url)),
  "請先在啟用 Emscripten 的 shell 執行 npm run build:itoulang");
process.env.ITOULANG_RUNTIME_URL = runtime.href;
process.env.ITOULANG_MAX_STEPS = "100000";
const { executionCode, wrapItouLangSource } = await import("../src/lib/itoulang.ts");
const { evaluateJudgeJob } = await import("../src/lib/judgeCore.ts");
const { verifyItouLangRuntime } = await import("./verify-itoulang-runtime.mjs");

function execute(code, input = "") {
  const result = spawnSync(process.execPath, ["-e", code], {
    cwd: fileURLToPath(new URL("../", import.meta.url)), input, encoding: "utf8", timeout: 15000, maxBuffer: 1024 * 1024,
  });
  assert.ifError(result.error);
  return result;
}
function run(code, input = "") { return execute(wrapItouLangSource(code), input); }

test("OJ loads the pinned C++ Wasm runtime without a native subprocess transport", async () => {
  await verifyItouLangRuntime(runtime.href);
  const code = executionCode("itoulang", "喵out << 42;");
  assert.match(code, /wasm-transport\.js/);
  assert.doesNotMatch(code, /child_process|worker_threads|src\/index\.js/);
  assert.equal(executionCode("cpp", "int main() {}"), "int main() {}");
});

test("submission/playground templates execute Chinese entry points and streams", () => {
  const playground = run(ITOULANG_PLAYGROUND_TEMPLATE);
  assert.equal(playground.status, 0, playground.stderr);
  assert.equal(playground.stdout, "你好，喵++！\n");
  const submission = run(ITOULANG_SUBMISSION_TEMPLATE, "你好 世界\r\n");
  assert.equal(submission.status, 0, submission.stderr);
  assert.equal(submission.stdout, "你好 世界\n");
});

test("wrapped stdin extraction preserves exact stdout and separates diagnostic streams", () => {
  const result = run(`整數 主程式() {
    整數 左邊; 整數 右邊;
    喵in >> 左邊 >> 右邊;
    喵out << 左邊 + 右邊;
    喵err << "提醒" << 喵endl;
    喵log << "紀錄";
    回傳 0;
  }`, "20 22\n");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "42");
  assert.equal(result.stderr, "提醒\n紀錄");
});

test("legacy programs and escaping typed closures remain usable on OJ", () => {
  const legacy = run('令 數值 = 讀數(); 喵(數值 * 2);', "21");
  assert.equal(legacy.status, 0, legacy.stderr);
  assert.equal(legacy.stdout, "42\n");
  const closure = run(`函式<整數(整數)> 計數器(整數 起始) {
    回傳 [&](整數 增量) -> 整數 { 起始 += 增量; 回傳 起始; };
  }
  自動 計數 = 計數器(10);
  迴圈 (整數 索引 = 0; 索引 < 3; ++索引) {
    如果 (索引 == 1) 繼續;
    喵out << 計數(1) << 喵endl;
  }`);
  assert.equal(closure.status, 0, closure.stderr);
  assert.equal(closure.stdout, "11\n12\n");
});

test("language diagnostics preserve partial stdout/stderr and exit nonzero", () => {
  const runtimeError = run('喵out << "前"; 喵err << "提醒\\n"; 喵(1 / 0);');
  assert.equal(runtimeError.status, 1);
  assert.equal(runtimeError.stdout, "前");
  assert.match(runtimeError.stderr, /^提醒\nmain\.itou:.*runtime: 除以零/);
  const typeError = run('喵out << "不可執行"; 整數 數值 = "錯誤";');
  assert.equal(typeError.status, 1);
  assert.equal(typeError.stdout, "");
  assert.match(typeError.stderr, /type:.*預期 number/);
  const inputError = run("整數 數值; 喵in >> 數值;", "bad");
  assert.equal(inputError.status, 1);
  assert.match(inputError.stderr, /喵in 預期數字/);
});

test("wrapper keeps submission text as data instead of executing JavaScript", () => {
  const result = run('喵out << "${process.exit(9)}" << "\\\"";');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '${process.exit(9)}"');
});

test("judge core grades real Wasm executions as AC, WA and RE", async () => {
  for (const [source, expected, want] of [
    ["整數 左邊; 整數 右邊; 喵in >> 左邊 >> 右邊; 喵out << 左邊 + 右邊;", "42", "AC"],
    ['喵out << "錯誤答案";', "42", "WA"],
    ['喵out << "前"; 喵(1 / 0);', "42", "RE"],
  ]) {
    const outcome = await evaluateJudgeJob({
      version: 1, submissionId: 1, language: "itoulang", code: source,
      timeLimitMs: 5000, memoryLimitMb: 256, recognition: null, hasSubtasks: false,
      groups: [{ points: null, subtaskOrder: null, checkMode: "full", tests: [{ id: 1, input: "20 22\n", output: expected }] }],
    }, async (params) => {
      assert.equal(params.language, "javascript");
      assert.equal(params.filename, "main.js");
      const result = execute(params.code, params.stdin);
      return { language: "javascript", version: "20.11.1", run: {
        stdout: result.stdout, stderr: result.stderr, code: result.status, signal: result.signal,
        cpu_time: 1, wall_time: 1, memory: 1024,
      } };
    });
    assert.equal(outcome.result.status, want);
    assert.equal(outcome.tests[0].verdict, want);
  }
});

test("Chinese stream/type/entry completions use the dedicated language mode", async () => {
  const extensions = await loadEditorLanguage("itoulang");
  const state = EditorState.create({ doc: "喵", extensions });
  ensureSyntaxTree(state, state.doc.length, 1000);
  const completion = await EDITOR_COMPLETIONS.itoulang(new CompletionContext(state, 1, true));
  const labels = completion.options.map((option) => option.label);
  for (const label of ["喵in", "喵out", "喵err", "喵log", "喵endl", "喵getline", "主程式", "整數", "迴圈", "自動", "無值"]) assert.ok(labels.includes(label), label);
  for (const doc of ['喵out << "喵', "// 喵", "/* 外層 /* 內層 */ 喵"]) {
    const state = EditorState.create({ doc, extensions });
    ensureSyntaxTree(state, state.doc.length, 1000);
    assert.equal(await EDITOR_COMPLETIONS.itoulang(new CompletionContext(state, doc.length, true)), null, doc);
  }
});
