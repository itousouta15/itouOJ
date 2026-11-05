// Run after authoring, before reference-program verification. These are the
// same formatters used by the site's editor; no generated native executable.
import { readFile, writeFile } from "node:fs/promises";
import { format as cppFormat } from "@wasm-fmt/clang-format";
import { format as pythonFormat } from "@wasm-fmt/ruff_fmt";

const batches = ["competition", "national1", "national2", "practice1", "practice2", "practice3", "practice4"];
const selected = process.argv[2];
if (selected && !batches.includes(selected)) throw new Error("Unknown batch");
for (const batch of selected ? [selected] : batches) {
  const path = new URL(`../src/lib/newProblemLessons/data/${batch}.json`, import.meta.url);
  const lessons = JSON.parse(await readFile(path, "utf8"));
  for (const lesson of lessons) {
    lesson.cpp = cppFormat(lesson.cpp, `${lesson.code}.cpp`, JSON.stringify({ BasedOnStyle: "LLVM", IndentWidth: 4, ColumnLimit: 88, AllowShortFunctionsOnASingleLine: "None", AllowShortIfStatementsOnASingleLine: "Never", AllowShortLoopsOnASingleLine: false }));
    lesson.python = pythonFormat(lesson.python, `${lesson.code}.py`, { indent_style: "space", indent_width: 4, line_width: 88, quote_style: "double" });
  }
  await writeFile(path, JSON.stringify(lessons, null, 2) + "\n");
  console.log(`${batch}: formatted ${lessons.length} C++/Python references`);
}
