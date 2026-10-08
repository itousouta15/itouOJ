import { readFile } from "node:fs/promises";
import ts from "typescript";

const sourceRoot = new URL("../../src/", import.meta.url);
export async function resolve(specifier, context, nextResolve) {
  const target = specifier.startsWith("@/") ? new URL(specifier.slice(2), sourceRoot).href : specifier;
  try { return await nextResolve(target, context); }
  catch (error) {
    if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
    for (const extension of [".ts", ".tsx", ".js"]) {
      try { return await nextResolve(target + extension, context); } catch { /* try next extension */ }
    }
    throw error;
  }
}
export async function load(url, context, nextLoad) {
  if (!/\.tsx?$/.test(url)) return nextLoad(url, context);
  const source = await readFile(new URL(url), "utf8");
  return {
    format: "module", shortCircuit: true,
    source: ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      fileName: new URL(url).pathname,
    }).outputText,
  };
}
