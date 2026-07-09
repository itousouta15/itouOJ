const PISTON_URL = process.env.PISTON_URL ?? "http://localhost:2000";

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
  const res = await fetch(`${PISTON_URL}/api/v2/execute`, {
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
    throw new Error(`Piston HTTP ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as PistonResult;
}
