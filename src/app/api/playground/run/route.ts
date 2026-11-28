import { getSession } from "@/lib/auth";
import { execute } from "@/lib/execute";
import { executionCode } from "@/lib/itoulang";
import { LANGUAGES } from "@/lib/languages";
import { playgroundLimits, type PlaygroundRunResult } from "@/lib/playground";
import { playgroundRunSchema } from "@/lib/playgroundRequest";
import { enforceRateLimit } from "@/lib/rateLimit";
import { acquireExecutionSlot, releaseExecutionSlot } from "@/lib/runLimit";
import { compileFailed, executionTimeMs } from "@/lib/sandboxProtocol";
import { SandboxBusyError } from "@/lib/sandboxQueue";

export const runtime = "nodejs";

const clip = (text: string) => text.length > 32000
  ? text.slice(0, 32000) + "\n…（輸出過長，已截斷）" : text;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const limited = enforceRateLimit(`run:${session.userId}`, 12, 60_000);
  if (limited) return limited;
  const parsed = playgroundRunSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const userKey = `user:${session.userId}`;
  if (!acquireExecutionSlot(userKey, 1)) {
    return Response.json({ error: "已有程式正在執行" }, { status: 429 });
  }
  if (!acquireExecutionSlot("global", 4)) {
    releaseExecutionSlot(userKey);
    return Response.json({ error: "評測系統忙碌中，請稍後再試" }, { status: 503 });
  }

  try {
    const { language, code, input } = parsed.data;
    const lang = LANGUAGES[language];
    const limits = playgroundLimits(language);
    const result = await execute({
      language: lang.runtime,
      version: lang.version,
      filename: lang.filename,
      code: executionCode(language, code),
      stdin: input,
      runTimeoutMs: limits.timeMs,
      runMemoryLimitBytes: limits.memoryMb * 1024 * 1024,
      priority: "test",
      signal: request.signal,
    });
    if (compileFailed(result)) {
      return Response.json({
        compileError: clip(result.compile?.stderr || result.compile?.output || "編譯失敗"),
      } satisfies PlaygroundRunResult);
    }
    const run = result.run;
    return Response.json({
      stdout: clip(run.stdout),
      stderr: clip(run.stderr),
      exitCode: run.code,
      signal: run.signal,
      killed: run.signal === "SIGKILL" || run.termination?.cause === "wall_timeout" || run.termination?.cause === "oom_kill",
      timeMs: executionTimeMs(run),
      memoryBytes: run.memory,
    } satisfies PlaygroundRunResult);
  } catch (error) {
    if (error instanceof SandboxBusyError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("[playground] execution failed", error);
    return Response.json({ error: "執行服務暫時無法使用，請稍後再試" }, { status: 502 });
  } finally {
    releaseExecutionSlot("global");
    releaseExecutionSlot(userKey);
  }
}
