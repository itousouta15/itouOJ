// itouLang 在 OJ 上的執行方式（方案 A）：沿用 sandbox-server 既有的
// `javascript` runtime，把使用者原始碼包成一段 CommonJS 程式，執行時以動態
// import 載入判題主機上的 itouLang runtime（bind-mount 於沙箱 /opt/runtime），
// 再呼叫其中的 run()，並把收集到的輸出寫到 stdout。
//
// 判題主機需把 itouLang 專案（含 package.json，type: module）放到 Node runtime
// 套件目錄下，例如：
//   /opt/piston-data/packages/node/20.11.1/itoulang/
// 沙箱內即對應到 file:///opt/runtime/itoulang/src/index.js。
export const ITOULANG_RUNTIME_URL =
  process.env.ITOULANG_RUNTIME_URL ?? "file:///opt/runtime/itoulang/src/index.js";

// 預設步數上限刻意放大，讓一般無窮迴圈先撞到沙箱的 wall timeout（判 TLE），
// 而不是提早被 itouLang 的步數上限攔成 RE。
const ITOULANG_MAX_STEPS = Number(process.env.ITOULANG_MAX_STEPS) || 100_000_000;

export function isItouLang(language: string): boolean {
  return language === "itoulang";
}

// 非 itouLang 的語言原樣回傳；itouLang 則換成可被 Node 執行的包裹程式。
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
    const result = runtime.run(source, { engine: "vm", maxSteps: maxSteps, input: fs.readFileSync(0, "utf8") });
    for (const line of result.output) process.stdout.write(line + "\\n");
  } catch (error) {
    process.stderr.write((error && error.message ? error.message : String(error)) + "\\n");
    process.exit(1);
  }
}, function (error) {
  process.stderr.write("itouLang 執行環境載入失敗：" + (error && error.message ? error.message : String(error)) + "\\n");
  process.exit(1);
});
`;
}
