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
  // 有給的話（同一筆 submission 前一筆測資編譯出來的執行檔）sandbox-runner
  // 會跳過重新編譯，直接拿這份去跑——見 judge.ts 的 compile-once 快取。
  precompiledBinary?: string;
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
      precompiled_binary: params.precompiledBinary,
    }),
  });
  if (!res.ok) {
    throw new Error(`sandbox-server HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PistonResult;
}
