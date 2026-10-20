import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { lessons } from "../src/lib/toiPotentialLessons/final.ts";

const args = process.argv.slice(2);
const index = args.indexOf("--python");
const python = index < 0 ? "python3" : args[index + 1];
execFileSync(
  python,
  [
    fileURLToPath(
      new URL("./lib/check-toi-potential-algorithms.py", import.meta.url),
    ),
  ],
  {
    input: JSON.stringify(lessons),
    stdio: ["pipe", "inherit", "inherit"],
    timeout: 180000,
  },
);
