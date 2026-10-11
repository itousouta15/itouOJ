// Node 沙箱直接載入 C++ 核心的 WebAssembly 版，不使用需要額外執行緒／
// 子程序的 src/index.js 原生 transport。部署套件必須包含 Wasm loader 與 binary。
export const ITOULANG_RUNTIME_URL =
  process.env.ITOULANG_RUNTIME_URL ?? "file:///opt/runtime/itoulang/src/wasm-transport.js";

// 預設步數上限刻意放大，讓一般無窮迴圈先撞到沙箱的 wall timeout（判 TLE），
// 而不是提早被喵++ 的步數上限攔成 RE。
const configuredSteps = Number(process.env.ITOULANG_MAX_STEPS);
const ITOULANG_MAX_STEPS = Number.isSafeInteger(configuredSteps) && configuredSteps > 0
  ? configuredSteps : 100_000_000;

export function isItouLang(language: string): boolean {
  return language === "itoulang";
}

// 非喵++ 的語言原樣回傳；喵++ 則換成可被 Node 執行的包裹程式。
export function executionCode(language: string, code: string): string {
  return isItouLang(language) ? wrapItouLangSource(code) : code;
}

export function wrapItouLangSource(code: string): string {
  return `"use strict";
const fs = require("node:fs");
const source = ${JSON.stringify(code)};
const runtimeUrl = ${JSON.stringify(ITOULANG_RUNTIME_URL)};
const maxSteps = ${ITOULANG_MAX_STEPS};
import(runtimeUrl).then(function (runtime) {
  try {
    const reply = runtime.request({ type: "run", source: source, filename: "main.itou",
      options: { engine: "vm", maxSteps: maxSteps, input: fs.readFileSync(0, "utf8") } });
    const result = reply.error ? reply : reply.result;
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    if (reply.error) {
      process.stderr.write((reply.formatted || reply.error.message) + "\\n");
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write((error && error.message ? error.message : String(error)) + "\\n");
    process.exitCode = 1;
  }
}, function (error) {
  process.stderr.write("喵++ 執行環境載入失敗：" + (error && error.message ? error.message : String(error)) + "\\n");
  process.exitCode = 1;
});
`;
}
