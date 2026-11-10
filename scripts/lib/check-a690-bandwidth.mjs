// Execute the actual published programs; never access a database.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cpeLessons } from "../../src/lib/cpeLessons.ts";
import { cpeProblemCatalog } from "../../src/lib/cpeProblemCatalog.ts";

const args = process.argv.slice(2);
const option = (key) => {
  const index = args.indexOf(key);
  return index < 0 ? undefined : args[index + 1];
};
const payload = JSON.stringify({
  cpp: cpeLessons.a690.cpp,
  python: cpeLessons.a690.python,
  samples: cpeProblemCatalog.find((problem) => problem.code === "a690").samples,
});
if (option("--export")) {
  writeFileSync(option("--export"), payload);
} else {
  if (process.platform === "win32")
    throw new Error("Export with --export, then run the Python checker in WSL; no Windows executables.");
  execFileSync(option("--python") ?? "python3", [
    fileURLToPath(new URL("./check-a690-bandwidth.py", import.meta.url)),
  ], { input: payload, stdio: ["pipe", "inherit", "inherit"], timeout: 180000 });
}
