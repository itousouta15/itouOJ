import type { PistonPhase, PistonResult } from "@/lib/piston";

const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://127.0.0.1:8090";

export type { PistonPhase, PistonResult };

// Same request/response shape as pistonExecute() by design (sandbox-runner's
// sandbox-server was built to match Piston's /api/v2/execute JSON exactly) --
// only C/C++/Python/JavaScript are supported so far; Java still goes through
// pistonExecute() until sandbox-runner grows a Java profile.
export async function sandboxExecute(params: {
  language: string;
  version: string;
  filename: string;
  code: string;
  stdin: string;
  runTimeoutMs: number;
  runMemoryLimitBytes: number;
}): Promise<PistonResult> {
  const res = await fetch(`${SANDBOX_URL}/api/v2/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: params.language,
      version: params.version,
      files: [{ name: params.filename, content: params.code }],
      stdin: params.stdin,
      compile_timeout: 15000,
      run_timeout: params.runTimeoutMs,
      run_memory_limit: params.runMemoryLimitBytes,
    }),
  });
  if (!res.ok) {
    throw new Error(`sandbox-server HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PistonResult;
}
