// Build the current application snapshot outside the repository. This script
// never copies .env, existing databases, .next, or user uploads; children receive
// an allowlisted OS environment plus synthetic test configuration only.
import { cp, copyFile, mkdtemp, rm, symlink, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import Database from "better-sqlite3";

const root = fileURLToPath(new URL("../", import.meta.url));
const parent = join(tmpdir(), "opencode");
if (!(await stat(parent)).isDirectory()) throw new Error("Expected existing isolated build parent");
const directory = process.argv[2] ? resolve(process.argv[2]) : await mkdtemp(join(parent, "itouoj-build-"));
if (dirname(directory) !== parent || !basename(directory).startsWith("itouoj-build-")) {
  throw new Error("Resume path must be an owned isolated build directory");
}
const env = {};
for (const key of ["PATH", "SystemRoot", "WINDIR", "COMSPEC", "TEMP", "TMP", "USERPROFILE", "LOCALAPPDATA", "APPDATA", "HOME"]) {
  if (process.env[key]) env[key] = process.env[key];
}
Object.assign(env, {
  NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
  DATABASE_URL: `file:${join(directory, "empty.db")}`,
  AUTH_SECRET: "isolated-build-placeholder-not-a-real-secret",
  JUDGE_WORKER_SECRET: "isolated-build-placeholder-not-a-real-secret",
  APP_URL: "http://127.0.0.1:3000", SANDBOX_URL: "http://127.0.0.1:1",
});
function command(file, args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      cwd: directory, env, stdio: ["ignore", capture ? "pipe" : "inherit", "inherit"],
    });
    let output = "";
    child.stdout?.on("data", (data) => { output += data; });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`Build command exited ${code}`)));
  });
}
try {
  await cp(join(root, "src"), join(directory, "src"), { recursive: true,
    filter: (path) => !/^\.env(?:\.|$)|\.db(?:-|$)/.test(basename(path)) });
  for (const file of ["package.json", "package-lock.json", "next.config.ts", "postcss.config.mjs", "tsconfig.json", "next-env.d.ts"]) {
    await copyFile(join(root, file), join(directory, file));
  }
  await copyFile(join(root, "prisma", "schema.prisma"), join(directory, "schema.prisma"));
  if (!process.argv[2]) await symlink(join(root, "node_modules"), join(directory, "node_modules"), "junction");
  const sql = await command(join(root, "node_modules/prisma/build/index.js"), [
    "migrate", "diff", "--from-empty", "--to-schema", join(directory, "schema.prisma"), "--script",
  ], true);
  await rm(join(directory, "empty.db"), { force: true });
  const db = new Database(join(directory, "empty.db"));
  try { db.exec(sql); } finally { db.close(); }
  console.info(`Isolated application build: ${directory}`);
  await command(join(root, "node_modules/next/dist/bin/next"), ["build", "--webpack"]);
} finally {
  // Unlink junction separately before recursively removing this owned directory.
  await rm(join(directory, "node_modules"), { recursive: true, force: true });
  await rm(directory, { recursive: true, force: true });
}
