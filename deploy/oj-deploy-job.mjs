// Persistent deployment queue for the website and the scheduled GitHub Action.
// Installed root-owned; all arguments are fixed commands and validated commit IDs.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const stateDir = "/var/lib/oj-git-deploy";
const sha = /^[a-f0-9]{40}$/;
const allowedPhases = new Set(["packaging", "uploading", "verifying"]);
const now = () => new Date().toISOString();

export function createDeployJobStore(directory) {
  const path = join(directory, "status.json");
  const read = () => {
    try { return JSON.parse(readFileSync(path, "utf8")); }
    catch (error) { if (error.code === "ENOENT") return { state: "idle" }; throw error; }
  };
  const save = (status) => {
    writeFileSync(join(directory, "status.next"), JSON.stringify({ ...status, updatedAt: now() }), { mode: 0o600 });
    renameSync(join(directory, "status.next"), path);
  };
  return {
    claim() {
      const job = read();
      if (job.state !== "queued" || !sha.test(job.target)) return null;
      save({ ...job, state: "running", phase: "claimed" });
      return job.target;
    },
    verify(target) { const job = read(); return sha.test(target) && job.state === "running" && job.target === target; },
    phase(target, phase) {
      if (!this.verify(target) || !allowedPhases.has(phase)) return false;
      save({ ...read(), phase });
      return true;
    },
    finish(target) {
      if (!this.verify(target)) return false;
      let deployed;
      try { deployed = readFileSync(join(directory, "revision"), "utf8").trim(); }
      catch (error) { if (error.code === "ENOENT") return false; throw error; }
      if (deployed !== target) return false;
      save({ ...read(), state: "succeeded", phase: "done" });
      return true;
    },
    fail(target) {
      if (!this.verify(target)) return false;
      const job = read();
      save({ ...job, state: "failed", message: "部署失敗，請檢查 GitHub Actions 與主機日誌。" });
      return true;
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const store = createDeployJobStore(stateDir);
    const [action, target, phase] = process.argv.slice(2);
    if (action === "claim" && process.argv.length === 3) {
      const revision = store.claim();
      if (revision) process.stdout.write(`${revision}\n`);
    } else if (action === "phase" && process.argv.length === 5 && store.phase(target, phase)) { /* recorded */ }
    else if (action === "verify" && process.argv.length === 4 && store.verify(target)) { /* allowed */ }
    else if (action === "finish" && process.argv.length === 4 && store.finish(target)) { /* recorded */ }
    else if (action === "fail" && process.argv.length === 4) store.fail(target);
    else process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ event: "deploy.job_failed", error: error instanceof Error ? error.name : "Unknown" }));
    process.exitCode = 1;
  }
}
