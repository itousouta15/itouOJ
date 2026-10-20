// Compare only immutable, published OJ commits. Refuse downgrades and forks.
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sha = /^[a-f0-9]{40}$/;
export async function isStrictlyNewer(deployed, target, fetcher = fetch) {
  if (!sha.test(deployed) || !sha.test(target) || deployed === target) return false;
  const response = await fetcher(`https://api.github.com/repos/itousouta15/itouOJ/compare/${deployed}...${target}`, {
    redirect: "error", signal: AbortSignal.timeout(15_000),
    headers: { Accept: "application/vnd.github+json", "User-Agent": "itouOJ-deployment" },
  });
  if (!response.ok || !response.body) { await response.body?.cancel(); throw new Error("GitHub comparison unavailable"); }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8 * 1024 * 1024) throw new Error("GitHub comparison is too large");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return data.status === "ahead" && Number.isInteger(data.ahead_by) && data.ahead_by > 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4 || !(await isStrictlyNewer(process.argv[2], process.argv[3]))) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ event: "deploy.revision_rejected", error: error instanceof Error ? error.name : "Unknown" }));
    process.exitCode = 1;
  }
}
