import { z } from "zod";

const elapsed = z.number().nonnegative().max(2147483647).nullable();
const memory = z.number().nonnegative().max(2147483647 * 1024).nullable();
const phaseSchema = z.object({
  stdout: z.string(), stderr: z.string(), output: z.string(),
  code: z.number().int().min(-2147483648).max(2147483647).nullable(),
  signal: z.string().max(128).nullable(), memory, cpu_time: elapsed, wall_time: elapsed,
  message: z.string().nullable().optional(), status: z.string().nullable().optional(),
});
const measurements = { wall_ms: elapsed, cpu_ms: elapsed, memory_peak_bytes: memory };
const stageSchema = z.object({ status: z.string(), cause: z.string(), ...measurements }).strict();
const reportSchema = z.object({
  schema_version: z.literal(1), compile: stageSchema, start: stageSchema,
  run: stageSchema.extend({
    exit_code: z.number().int().min(0).max(255).nullable().optional(),
    signal_number: z.number().int().min(0).max(64).nullable().optional(),
    oom_kill_count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable().optional(),
  }).strict(),
}).strict();
const metric = z.number().nonnegative();
const executionSchema = z.object({
  language: z.string(), version: z.string(), compile: phaseSchema.optional(), run: phaseSchema.optional(),
  compiled_binary: z.string().optional(), compiled_handle: z.string().max(4096).optional(),
  compiled_cache_hit: z.boolean().optional(), execution_report: reportSchema.optional(),
  metrics: z.object({
    setup_ms: metric, compile_ms: metric, run_ms: metric, cleanup_ms: metric, total_ms: metric, request_bytes: metric,
  }).optional(),
}).refine((value) => value.run !== undefined || (value.compile !== undefined && value.compile.code !== 0));

export type ExecutionReport = z.infer<typeof reportSchema>;
export type ExecutionPhase = z.infer<typeof phaseSchema> & {
  // Derived only from a validated top-level execution_report, never accepted
  // from the raw phase. Keeps existing runVerdict(result.run, ...) callers safe.
  termination?: ExecutionReport["run"];
};
export type ExecutionResult = Omit<z.infer<typeof executionSchema>, "run"> & { run: ExecutionPhase };

export class SandboxInfrastructureError extends Error {
  constructor(message = "Sandbox execution unavailable") { super(message); this.name = "SandboxInfrastructureError"; }
}
function requireEvidence(valid: boolean): asserts valid {
  if (!valid) throw new SandboxInfrastructureError("Invalid sandbox execution evidence");
}
const noMeasurements = (stage: ExecutionReport["compile"]) =>
  stage.wall_ms === null && stage.cpu_ms === null && stage.memory_peak_bytes === null;
const sameMeasurements = (phase: ExecutionPhase, stage: ExecutionReport["compile"]) =>
  phase.wall_time === stage.wall_ms && phase.cpu_time === stage.cpu_ms && phase.memory === stage.memory_peak_bytes;
const signalNames: Record<number, string> = {
  9: "SIGKILL", 11: "SIGSEGV", 6: "SIGABRT", 8: "SIGFPE", 31: "SIGSYS",
  13: "SIGPIPE", 7: "SIGBUS", 4: "SIGILL", 24: "SIGXCPU", 25: "SIGXFSZ",
};

function validateReport(result: ExecutionResult) {
  const report = result.execution_report!;
  const { compile, start, run } = report;
  const allowed: Record<string, Record<string, readonly string[]>> = {
    compile: { completed: ["exit"], failed: ["nonzero_exit", "signal", "wall_timeout", "launcher_error"], skipped: ["interpreted"] },
    start: { exec_attempted: ["exec_attempted"], failed: ["bootstrap_failed", "exec_failed"], skipped: ["compile_failed"], unknown: ["metadata_unavailable"] },
    run: { completed: ["exit"], failed: ["nonzero_exit", "wall_timeout", "oom_kill", "sigsys", "signal"],
      skipped: ["compile_failed", "bootstrap_failed", "exec_failed", "wall_timeout"],
      unknown: ["metadata_unavailable", "launcher_error", "supervisor_timeout"] },
  };
  for (const name of ["compile", "start", "run"] as const) {
    requireEvidence(allowed[name][report[name].status]?.includes(report[name].cause) === true);
  }
  requireEvidence(noMeasurements(start) && compile.cpu_ms === null && compile.memory_peak_bytes === null);
  const rawCompile = result.compile;
  requireEvidence(rawCompile !== undefined);
  if (compile.status === "skipped") {
    requireEvidence(noMeasurements(compile) && rawCompile.code === 0 && rawCompile.signal === null &&
      rawCompile.cpu_time === null && rawCompile.wall_time === 0 && rawCompile.memory === 0);
  } else {
    requireEvidence(rawCompile.cpu_time === null && rawCompile.memory === null);
    if (compile.cause !== "launcher_error") {
      requireEvidence(compile.wall_ms !== null && sameMeasurements(rawCompile, compile));
      requireEvidence((rawCompile.signal === null && rawCompile.code !== null && rawCompile.code >= 0 && rawCompile.code <= 255) ||
        (rawCompile.signal !== null && rawCompile.code === null));
    }
    if (compile.cause === "exit") requireEvidence(rawCompile.code === 0 && rawCompile.signal === null);
    if (compile.cause === "nonzero_exit") requireEvidence(rawCompile.code !== null && rawCompile.code > 0 && rawCompile.code <= 255 && rawCompile.signal === null);
    if (compile.cause === "signal") requireEvidence(rawCompile.code === null && rawCompile.signal !== null);
  }
  if (compile.status === "failed") {
    requireEvidence(start.status === "skipped" && start.cause === "compile_failed" &&
      run.status === "skipped" && run.cause === "compile_failed" && noMeasurements(run) &&
      run.exit_code == null && run.signal_number == null && run.oom_kill_count == null);
    requireEvidence(result.run.code === -1 && result.run.signal === null && result.run.cpu_time === null &&
      result.run.wall_time === 0 && result.run.memory === 0);
    // In schema 1 compiler exec failure is indistinguishable from compiler exit
    // 127. Neither that nor a launcher failure is evidence of bad student code.
    if (compile.cause === "launcher_error" || rawCompile.code === 127) throw new SandboxInfrastructureError("Compiler unavailable");
    return;
  }
  requireEvidence(start.status !== "skipped" && run.cause !== "compile_failed");
  requireEvidence((start.status === "unknown") === (run.status === "unknown"));
  requireEvidence(run.exit_code !== undefined && run.signal_number !== undefined && run.oom_kill_count !== undefined);
  if (run.status === "unknown") {
    requireEvidence(noMeasurements(run) && run.exit_code === null && run.signal_number === null && run.oom_kill_count === null);
    throw new SandboxInfrastructureError("Sandbox execution evidence unavailable");
  }
  if (start.status === "failed") requireEvidence(run.status === "skipped" && [start.cause, "wall_timeout"].includes(run.cause));
  else requireEvidence(start.status === "exec_attempted" && ["completed", "failed"].includes(run.status));
  const code = run.exit_code, sig = run.signal_number, oom = run.oom_kill_count;
  requireEvidence(run.wall_ms !== null && ((sig === 0 && code !== null) || (sig !== null && sig > 0 && code === null)));
  requireEvidence(result.run.code === code && result.run.signal === (sig ? signalNames[sig] ?? `SIG${sig}` : null) && sameMeasurements(result.run, run));
  switch (run.cause) {
    case "exit": requireEvidence(code === 0 && sig === 0); break;
    case "nonzero_exit": requireEvidence(code !== null && code > 0 && sig === 0); break;
    case "oom_kill": requireEvidence(sig === 9 && oom !== null && oom > 0); break;
    case "sigsys": requireEvidence(sig === 31); break;
    case "signal": requireEvidence(sig !== null && sig > 0 && sig !== 31 && !(sig === 9 && oom !== null && oom > 0)); break;
    case "bootstrap_failed": case "exec_failed": requireEvidence(code !== 0); break;
  }
  if (start.status !== "exec_attempted" || (run.cause === "signal" && sig === 9)) {
    throw new SandboxInfrastructureError("Sandbox startup failed or termination is unattributed");
  }
}

export function parseSandboxExecution(value: unknown): ExecutionResult {
  const parsed = executionSchema.safeParse(value);
  if (!parsed.success) throw new SandboxInfrastructureError("Invalid sandbox response");
  // Legacy compile failures may omit run. All callers check compilation first.
  const result: ExecutionResult = { ...parsed.data, run: parsed.data.run ?? parsed.data.compile! };
  if (result.execution_report) {
    requireEvidence(parsed.data.run !== undefined);
    validateReport(result);
    result.run = { ...result.run, termination: result.execution_report.run };
  } else if (!compileFailed(result) && result.run.code === -1 && result.run.signal === null) {
    throw new SandboxInfrastructureError("Legacy sandbox execution unavailable");
  }
  return result;
}

export function compileFailed(result: ExecutionResult) {
  return result.execution_report ? result.execution_report.compile.status === "failed" :
    result.compile !== undefined && result.compile.code !== 0;
}

// timeMs is the existing duration field: measured CPU when available, otherwise
// wall duration. Preserve both raw measurements and never fabricate a zero.
export function executionTimeMs(run: ExecutionPhase): number | null {
  const measured = run.cpu_time ?? run.wall_time;
  return measured === null ? null : Math.round(measured);
}
