import assert from "node:assert/strict";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export async function verifyItouLangRuntime(runtimeUrl) {
  const { request } = await import(runtimeUrl);
  assert.equal(typeof request, "function", "喵++ 0.3 Wasm transport required");
  const success = request({ type: "run", source: `整數 主程式() {
    整數 左邊; 整數 右邊;
    喵in >> 左邊 >> 右邊;
    喵out << 左邊 + 右邊;
    喵log << "紀錄" << 喵endl;
    回傳 0;
  }`, options: { input: "20 22\n" } });
  assert.ok(!success.error, JSON.stringify(success.error));
  assert.equal(success.result.stdout, "42");
  assert.equal(success.result.stderr, "紀錄\n");
  const failure = request({ type: "run", source: '喵out << "前"; 喵err << "提醒"; 喵(1 / 0);' });
  assert.equal(failure.error?.phase, "runtime");
  assert.equal(failure.stdout, "前");
  assert.equal(failure.stderr, "提醒");
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (!process.argv[2]) throw new Error("Usage: node verify-itoulang-runtime.mjs <wasm-transport.js>");
  await verifyItouLangRuntime(pathToFileURL(resolve(process.argv[2])).href);
  console.log(`喵++ 0.3 Wasm runtime verified (${process.version}).`);
}
