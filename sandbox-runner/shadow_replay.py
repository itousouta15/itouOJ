#!/usr/bin/env python3
"""M6 shadow-mode harness.

Replays every historical C/C++ submission in the production DB through
BOTH Piston (the live judge engine) and sandbox-server (the new
namespace/cgroup/seccomp sandbox from M1-M5), using the exact same verdict
logic as src/lib/judge.ts (normalizeOutput / runVerdict), and logs any
mismatch. Read-only against the DB -- never writes back to it.

Standalone by design, per the plan's "judge.ts (or a standalone harness)"
option: this validates the new engine against real historical data without
touching the live Next.js app, judge.ts, or requiring a deploy/restart of
the production service at all. Piston remains authoritative; this only
observes.
"""
import json
import re
import sqlite3
import sys
import time
import urllib.request

DB_PATH = "/opt/online-judge/oj.db"
PISTON_URL = "http://127.0.0.1:2000/api/v2/execute"
SANDBOX_URL = "http://127.0.0.1:8090/api/v2/execute"
LOG_PATH = "shadow-log.jsonl"

# Mirrors src/lib/languages.ts -- sandbox-server (M5) only supports c/cpp so
# far, matching what's been hardened through M4.
LANG_MAP = {
    "cpp": {"piston": "c++", "version": "10.2.0", "filename": "main.cpp",
            "time_mult": 1, "mem_mult": 1},
    "c": {"piston": "c", "version": "10.2.0", "filename": "main.c",
          "time_mult": 1, "mem_mult": 1},
}


def normalize_output(text):
    """Mirrors normalizeOutput() in src/lib/judge.ts exactly."""
    text = text.replace("\r\n", "\n")
    lines = [re.sub(r"[ \t]+$", "", line) for line in text.split("\n")]
    text = "\n".join(lines)
    return re.sub(r"\n+$", "", text)


def run_verdict(run, time_limit_ms, expected):
    """Mirrors runVerdict() in src/lib/judge.ts exactly."""
    if run.get("signal") == "SIGKILL":
        wall = run.get("wall_time") or 0
        cpu = run.get("cpu_time") or 0
        if wall >= time_limit_ms or cpu >= time_limit_ms:
            return "TLE"
        return "MLE"
    if run.get("code") != 0:
        return "RE"
    return "AC" if normalize_output(run.get("stdout", "")) == normalize_output(expected) else "WA"


def execute(url, language, version, filename, code, stdin, run_timeout_ms,
            run_memory_limit_bytes, compile_timeout_ms=15000):
    payload = json.dumps({
        "language": language,
        "version": version,
        "files": [{"name": filename, "content": code}],
        "stdin": stdin,
        "compile_timeout": compile_timeout_ms,
        "run_timeout": run_timeout_ms,
        "run_memory_limit": run_memory_limit_bytes,
    }).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"},
        method="POST")
    timeout_s = (run_timeout_ms + compile_timeout_ms) / 1000 + 10
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        return json.loads(resp.read())


def judge_via(url, lang_key, code, test_cases, time_limit_ms, memory_limit_mb):
    lang = LANG_MAP[lang_key]
    t_limit = time_limit_ms * lang["time_mult"]
    m_limit_bytes = memory_limit_mb * lang["mem_mult"] * 1024 * 1024

    max_time, max_mem = 0, 0
    for tc in test_cases:
        result = execute(url, lang["piston"], lang["version"], lang["filename"],
                          code, tc["input"], t_limit, m_limit_bytes)
        compile_phase = result.get("compile")
        if compile_phase and compile_phase.get("code") not in (0, None):
            return "CE", 0, 0
        run = result["run"]
        time_ms = round(run.get("cpu_time") or run.get("wall_time") or 0)
        mem_kb = round((run.get("memory") or 0) / 1024)
        max_time = max(max_time, time_ms)
        max_mem = max(max_mem, mem_kb)
        verdict = run_verdict(run, t_limit, tc["output"])
        if verdict != "AC":
            return verdict, max_time, max_mem
    return "AC", max_time, max_mem


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    subs = conn.execute(
        "SELECT id, problemId, language, code, status FROM Submission "
        "WHERE language IN ('c','cpp') ORDER BY id"
    ).fetchall()

    total, mismatches = 0, 0
    with open(LOG_PATH, "a") as log:
        for sub in subs:
            problem = conn.execute(
                "SELECT timeLimitMs, memoryLimitMb FROM Problem WHERE id=?",
                (sub["problemId"],)).fetchone()
            test_cases = conn.execute(
                'SELECT input, output FROM TestCase WHERE problemId=? '
                'ORDER BY "order", id', (sub["problemId"],)).fetchall()
            if not test_cases:
                continue
            tcs = [{"input": tc["input"], "output": tc["output"]} for tc in test_cases]

            try:
                piston_verdict, piston_time, piston_mem = judge_via(
                    PISTON_URL, sub["language"], sub["code"], tcs,
                    problem["timeLimitMs"], problem["memoryLimitMb"])
            except Exception as e:
                piston_verdict, piston_time, piston_mem = f"ERROR:{e}", 0, 0
            try:
                sandbox_verdict, sandbox_time, sandbox_mem = judge_via(
                    SANDBOX_URL, sub["language"], sub["code"], tcs,
                    problem["timeLimitMs"], problem["memoryLimitMb"])
            except Exception as e:
                sandbox_verdict, sandbox_time, sandbox_mem = f"ERROR:{e}", 0, 0

            total += 1
            match = piston_verdict == sandbox_verdict
            if not match:
                mismatches += 1

            record = {
                "submission_id": sub["id"],
                "language": sub["language"],
                "original_status": sub["status"],
                "piston_verdict": piston_verdict,
                "sandbox_verdict": sandbox_verdict,
                "match": match,
                "piston_time_ms": piston_time,
                "sandbox_time_ms": sandbox_time,
                "piston_memory_kb": piston_mem,
                "sandbox_memory_kb": sandbox_mem,
                "ts": time.time(),
            }
            log.write(json.dumps(record) + "\n")
            log.flush()
            status = "OK" if match else "MISMATCH"
            print(f"[{status}] sub={sub['id']} lang={sub['language']} "
                  f"piston={piston_verdict} sandbox={sandbox_verdict} "
                  f"orig={sub['status']}")

    print(f"\n--- summary: {total} compared, {mismatches} mismatches ---")
    return 1 if mismatches > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
