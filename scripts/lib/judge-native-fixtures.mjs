// Independent wire examples transcribed from itouSandbox/src/server.c:
// build_phase_json(), stage_report(), and add_run_result(), schema version 1.
// These are representative responses, not claimed live captures. No OJ parser
// or grading helper generates the legacy fields or the evidence below.
export const nativeCompiledSuccess = {
  language: "c++", version: "sandbox-runner-m7",
  compile: { stdout: "", stderr: "", output: "", code: 0, signal: null, memory: null, cpu_time: null, wall_time: 12.25 },
  run: { stdout: "ok\n", stderr: "", output: "ok\n", code: 0, signal: null, memory: 143360, cpu_time: 1.08, wall_time: 55 },
  execution_report: {
    schema_version: 1,
    compile: { status: "completed", cause: "exit", wall_ms: 12.25, cpu_ms: null, memory_peak_bytes: null },
    start: { status: "exec_attempted", cause: "exec_attempted", wall_ms: null, cpu_ms: null, memory_peak_bytes: null },
    run: { status: "completed", cause: "exit", wall_ms: 55, cpu_ms: 1.08, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: 0, signal_number: 0 },
  },
};

export const nativeInterpretedSuccess = {
  language: "python", version: "sandbox-runner-m7",
  compile: { stdout: "", stderr: "", output: "", code: 0, signal: null, memory: 0, cpu_time: null, wall_time: 0 },
  run: { stdout: "ok\n", stderr: "", output: "ok\n", code: 0, signal: null, memory: 8388608, cpu_time: 0, wall_time: 55 },
  execution_report: {
    schema_version: 1,
    compile: { status: "skipped", cause: "interpreted", wall_ms: null, cpu_ms: null, memory_peak_bytes: null },
    start: { status: "exec_attempted", cause: "exec_attempted", wall_ms: null, cpu_ms: null, memory_peak_bytes: null },
    run: { status: "completed", cause: "exit", wall_ms: 55, cpu_ms: 0, memory_peak_bytes: 8388608,
      oom_kill_count: 0, exit_code: 0, signal_number: 0 },
  },
};

export const nativeCompileFailure = {
  language: "c++", version: "sandbox-runner-m7",
  compile: { stdout: "", stderr: "compiler error", output: "compiler error", code: 1, signal: null, memory: null, cpu_time: null, wall_time: 4.25 },
  run: { stdout: "", stderr: "", output: "", code: -1, signal: null, memory: 0, cpu_time: null, wall_time: 0 },
  execution_report: {
    schema_version: 1,
    compile: { status: "failed", cause: "nonzero_exit", wall_ms: 4.25, cpu_ms: null, memory_peak_bytes: null },
    start: { status: "skipped", cause: "compile_failed", wall_ms: null, cpu_ms: null, memory_peak_bytes: null },
    run: { status: "skipped", cause: "compile_failed", wall_ms: null, cpu_ms: null, memory_peak_bytes: null },
  },
};

// Each pair spells out both wire representations independently. In particular,
// signals use legacy code:null, report exit_code:null; ordinary exits do not.
export const nativeRunCases = [
  { name: "unavailable counters", verdict: "AC",
    phase: { code: 0, signal: null, memory: null, cpu_time: null, wall_time: 55 },
    report: { status: "completed", cause: "exit", wall_ms: 55, cpu_ms: null, memory_peak_bytes: null,
      oom_kill_count: null, exit_code: 0, signal_number: 0 } },
  { name: "ordinary exit 124", verdict: "RE",
    phase: { code: 124, signal: null, memory: 143360, cpu_time: 1.08, wall_time: 55 },
    report: { status: "failed", cause: "nonzero_exit", wall_ms: 55, cpu_ms: 1.08, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: 124, signal_number: 0 } },
  { name: "ordinary exit 139", verdict: "RE",
    phase: { code: 139, signal: null, memory: 143360, cpu_time: 1.08, wall_time: 55 },
    report: { status: "failed", cause: "nonzero_exit", wall_ms: 55, cpu_ms: 1.08, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: 139, signal_number: 0 } },
  { name: "SIGSEGV", verdict: "RE",
    phase: { code: null, signal: "SIGSEGV", memory: 143360, cpu_time: 1.08, wall_time: 55 },
    report: { status: "failed", cause: "signal", wall_ms: 55, cpu_ms: 1.08, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: null, signal_number: 11 } },
  { name: "SIGSYS", verdict: "RE",
    phase: { code: null, signal: "SIGSYS", memory: 143360, cpu_time: 1.08, wall_time: 55 },
    report: { status: "failed", cause: "sigsys", wall_ms: 55, cpu_ms: 1.08, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: null, signal_number: 31 } },
  { name: "deadline takes precedence over concurrent OOM", verdict: "TLE",
    phase: { code: null, signal: "SIGKILL", memory: 67108864, cpu_time: 5, wall_time: 1005 },
    report: { status: "failed", cause: "wall_timeout", wall_ms: 1005, cpu_ms: 5, memory_peak_bytes: 67108864,
      oom_kill_count: 1, exit_code: null, signal_number: 9 } },
  { name: "OOM evidence beats the legacy elapsed-time heuristic", verdict: "MLE",
    phase: { code: null, signal: "SIGKILL", memory: 67108864, cpu_time: 1200, wall_time: 1200 },
    report: { status: "failed", cause: "oom_kill", wall_ms: 1200, cpu_ms: 1200, memory_peak_bytes: 67108864,
      oom_kill_count: 1, exit_code: null, signal_number: 9 } },
  { name: "unattributed SIGKILL", infrastructure: true,
    phase: { code: null, signal: "SIGKILL", memory: 143360, cpu_time: 1200, wall_time: 1200 },
    report: { status: "failed", cause: "signal", wall_ms: 1200, cpu_ms: 1200, memory_peak_bytes: 143360,
      oom_kill_count: 0, exit_code: null, signal_number: 9 } },
  { name: "bootstrap failure", infrastructure: true, start: { status: "failed", cause: "bootstrap_failed" },
    phase: { code: 1, signal: null, memory: 0, cpu_time: 0, wall_time: 5 },
    report: { status: "skipped", cause: "bootstrap_failed", wall_ms: 5, cpu_ms: 0, memory_peak_bytes: 0,
      oom_kill_count: 0, exit_code: 1, signal_number: 0 } },
  { name: "exec failure", infrastructure: true, start: { status: "failed", cause: "exec_failed" },
    phase: { code: 127, signal: null, memory: 4096, cpu_time: 0.05, wall_time: 5 },
    report: { status: "skipped", cause: "exec_failed", wall_ms: 5, cpu_ms: 0.05, memory_peak_bytes: 4096,
      oom_kill_count: 0, exit_code: 127, signal_number: 0 } },
  { name: "deadline during bootstrap", infrastructure: true, start: { status: "failed", cause: "bootstrap_failed" },
    phase: { code: null, signal: "SIGKILL", memory: null, cpu_time: null, wall_time: 1005 },
    report: { status: "skipped", cause: "wall_timeout", wall_ms: 1005, cpu_ms: null, memory_peak_bytes: null,
      oom_kill_count: null, exit_code: null, signal_number: 9 } },
  { name: "metadata unavailable", infrastructure: true, start: { status: "unknown", cause: "metadata_unavailable" },
    phase: { code: -1, signal: null, memory: null, cpu_time: null, wall_time: null },
    report: { status: "unknown", cause: "metadata_unavailable", wall_ms: null, cpu_ms: null, memory_peak_bytes: null,
      oom_kill_count: null, exit_code: null, signal_number: null } },
];

export function nativeRunResponse(example) {
  const response = structuredClone(nativeCompiledSuccess);
  Object.assign(response.run, example.phase);
  Object.assign(response.execution_report.start, example.start);
  response.execution_report.run = structuredClone(example.report);
  return response;
}
