// Build an artifact from an immutable commit/tree, not from generated/dirty files.
// The archive includes the generated Wasm pair but excludes compiler caches.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";

const root = fileURLToPath(new URL("../", import.meta.url));
const vendor = join(root, "vendor/itoulang");
const { values } = parseArgs({ options: { revision: { type: "string" }, output: { type: "string" } } });
function execute(command, args, cwd = root, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", stdio: capture ? "pipe" : "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr ?? ""}`);
  return result.stdout;
}
if (!existsSync(join(vendor, "package.json"))) throw new Error("請先執行 git submodule update --init --recursive");
const revision = values.revision ?? execute("git", ["rev-parse", "HEAD:vendor/itoulang"], root, true).trim();
const sourceTree = execute("git", ["rev-parse", "--verify", `${revision}^{tree}`], vendor, true).trim();
const artifacts = join(root, "artifacts");
mkdirSync(artifacts, { recursive: true });
const output = resolve(values.output ?? join(artifacts, "itoulang.tar.gz"));
if (!existsSync(dirname(output))) throw new Error("Archive output parent must already exist");
const stage = mkdtempSync(join(artifacts, "itoulang-release-"));
const partial = join(dirname(output), `.itoulang-${randomUUID()}.tar.gz`);
try {
  const sourceArchive = join(stage, "source.tar");
  execute("git", ["archive", "--format=tar", "--prefix=vendor/itoulang/", "-o", sourceArchive, sourceTree], vendor);
  execute("tar", ["-xf", sourceArchive, "-C", stage]);
  const runtime = join(stage, "vendor/itoulang");
  const manifest = JSON.parse(readFileSync(join(runtime, "package.json"), "utf8"));
  if (manifest.version !== "0.3.0" || manifest.displayName !== "喵++") throw new Error("釋出需要喵++ 0.3.0；請同步語言 gitlink 或指定已驗證的語言快照");
  execute(process.execPath, [join(runtime, "tools/build.mjs"), "--wasm"], runtime);
  execute(process.execPath, [join(root, "scripts/verify-itoulang-runtime.mjs"), join(runtime, "src/wasm-transport.js")]);
  const tracked = execute("git", ["ls-tree", "-r", "--name-only", "-z", sourceTree], vendor, true)
    .split("\0").filter(Boolean).map((file) => `vendor/itoulang/${file}`);
  execute("tar", ["-czf", partial, "-C", stage, ...tracked,
    "vendor/itoulang/web/native/itou.js", "vendor/itoulang/web/native/itou.wasm"]);
  renameSync(partial, output);
  console.log(`Packaged 喵++ ${manifest.version} (tree ${sourceTree}) -> ${output}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
  rmSync(partial, { force: true });
}
