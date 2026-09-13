const PISTON_URL = process.env.PISTON_URL ?? "http://localhost:2000";
const COMPILE_TIMEOUT_MS = 15_000;
const TRANSPORT_GRACE_MS = 15_000;

export interface PistonPhase {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  memory: number | null; // bytes
  cpu_time: number; // ms
  wall_time: number; // ms
  message?: string | null;
  status?: string | null;
}

export interface PistonResult {
  language: string;
  version: string;
  compile?: PistonPhase;
  run: PistonPhase;
  // 只有 sandbox-runner 會回傳（見 sandbox.ts）：這次編譯出來的執行檔，
  // 同一筆 submission 的後續測資可直接重用，不用每筆重編。
  compiled_binary?: string;
}

export async function pistonExecute(params: {
  language: string;
  version: string;
  filename: string;
  code: string;
  stdin: string;
  runTimeoutMs: number;
  runMemoryLimitBytes: number;
}): Promise<PistonResult> {
  const timeoutMs = COMPILE_TIMEOUT_MS + params.runTimeoutMs + TRANSPORT_GRACE_MS;
  const res = await fetch(`${PISTON_URL}/api/v2/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: params.language,
      version: params.version,
      files: [{ name: params.filename, content: params.code }],
      stdin: params.stdin,
      compile_timeout: COMPILE_TIMEOUT_MS,
      run_timeout: params.runTimeoutMs,
      run_memory_limit: params.runMemoryLimitBytes,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`Piston HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PistonResult;
}
