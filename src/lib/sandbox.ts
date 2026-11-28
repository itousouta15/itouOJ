import { withSandboxTurn, type SandboxPriority } from "@/lib/sandboxQueue";
import { readJudgeJson } from "@/lib/judgeWire";
import { parseSandboxExecution, type ExecutionResult } from "@/lib/sandboxProtocol";
export type { ExecutionPhase, ExecutionResult } from "@/lib/sandboxProtocol";

const SANDBOX_URL = process.env.SANDBOX_URL ?? "http://127.0.0.1:8090";
const COMPILE_TIMEOUT_MS = 15_000;
const TRANSPORT_GRACE_MS = 15_000;

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
  priority: SandboxPriority;
  signal?: AbortSignal;
}): Promise<ExecutionResult> {
  return withSandboxTurn(params.priority, async (queueMs) => {
    // Start the HTTP timeout after admission; otherwise waiting behind an
    // active execution can turn a correct submission into a transport IE.
    const startedAt = performance.now();
    const timeoutMs = COMPILE_TIMEOUT_MS + params.runTimeoutMs + TRANSPORT_GRACE_MS;
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = params.signal ? AbortSignal.any([timeout, params.signal]) : timeout;
    try {
      const res = await fetch(`${SANDBOX_URL}/api/v2/execute`, {
        method: "POST",
        redirect: "error",
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
        signal,
      });
      if (!res.ok) {
        await res.body?.cancel();
        throw new Error(`sandbox-server HTTP ${res.status}`);
      }
      const result = parseSandboxExecution(await readJudgeJson(res, 32 * 1024 * 1024));
      console.info("[sandbox-metrics]", JSON.stringify({
        priority: params.priority,
        language: params.language,
        queueMs: Math.round(queueMs),
        transportMs: Math.round(performance.now() - startedAt),
        cacheHit: result.compiled_cache_hit ?? false,
        ...result.metrics,
      }));
      return result;
    } catch (error) {
      console.error("[sandbox-metrics]", JSON.stringify({
        priority: params.priority,
        language: params.language,
        queueMs: Math.round(queueMs),
        transportMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.name : "UnknownError",
      }));
      throw error;
    }
  }, params.signal);
}
