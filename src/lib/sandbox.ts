const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://127.0.0.1:8090";
const COMPILE_TIMEOUT_MS = 15_000;
const TRANSPORT_GRACE_MS = 15_000;

export interface ExecutionPhase {
  stdout: string;
  stderr: string;
  output: string;
  code: number | null;
  signal: string | null;
  memory: number | null;
  cpu_time: number;
  wall_time: number;
  message?: string | null;
  status?: string | null;
}

export interface ExecutionResult {
  language: string;
  version: string;
  compile?: ExecutionPhase;
  run: ExecutionPhase;
  compiled_binary?: string;
  compiled_handle?: string;
  compiled_cache_hit?: boolean;
}

// sandbox-server 沿用 /api/v2/execute 的 JSON 格式。
export async function sandboxExecute(params: {
  language: string;
  version: string;
  filename: string;
  code: string;
  stdin: string;
  runTimeoutMs: number;
  runMemoryLimitBytes: number;
  // 舊版沙箱使用 base64 執行檔；新版以短代碼在沙箱端重用編譯成果。
  precompiledBinary?: string;
  compiledHandle?: string;
}): Promise<ExecutionResult> {
  const timeoutMs = COMPILE_TIMEOUT_MS + params.runTimeoutMs + TRANSPORT_GRACE_MS;
  const res = await fetch(`${SANDBOX_URL}/api/v2/execute`, {
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
      precompiled_binary: params.precompiledBinary,
      want_compiled_handle: true,
      compiled_handle: params.compiledHandle,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`sandbox-server HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as ExecutionResult;
}
