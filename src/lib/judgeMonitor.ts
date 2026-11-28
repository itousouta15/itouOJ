import type { createJudgeQueue } from "@/lib/judgeQueue";

type QueueStatus = Awaited<ReturnType<ReturnType<typeof createJudgeQueue>["status"]>>;
type MonitorSession = { role: string } | null;
export const isJudgeMonitorAdmin = (session: MonitorSession) => session?.role === "ADMIN";

export function judgeMonitorSnapshot(status: QueueStatus) {
  const sampledAt = status.sampledAt.getTime();
  // Explicit allowlist: the browser never receives claims, source, tests, or
  // internal-worker credentials, even if the internal status API grows fields.
  const active = status.active.slice(0, 100).map((row) => ({
    submissionId: row.submissionId,
    heartbeatAt: row.heartbeatAt?.toISOString() ?? null,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    heartbeatAgeMs: row.heartbeatAt ? Math.max(0, sampledAt - row.heartbeatAt.getTime()) : null,
    state: !row.heartbeatAt || !row.leaseExpiresAt ? "unleased" as const :
      row.leaseExpiresAt.getTime() <= sampledAt ? "expired" as const : "live" as const,
  }));
  return {
    pending: status.pending, judging: status.judging, expired: status.expired,
    oldestPendingAgeMs: status.oldestPendingAgeMs, sampledAt: status.sampledAt.toISOString(),
    leaseMs: status.leaseMs, heartbeatMs: status.heartbeatMs,
    active, activeLimit: 100, activeTruncated: status.judging > active.length,
  };
}
export type JudgeMonitorSnapshot = ReturnType<typeof judgeMonitorSnapshot>;

export function createJudgeMonitorHandler(options: {
  getSession: () => Promise<MonitorSession>;
  getStatus: () => Promise<QueueStatus>;
}) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
    "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff",
  } });
  return async (request: Request) => {
    try {
      // Use the application's current session/DB role, not client headers or
      // the machine-to-machine worker secret. Re-authorize every refresh.
      if (!isJudgeMonitorAdmin(await options.getSession())) return json({ error: "需要管理員權限" }, 403);
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return json(judgeMonitorSnapshot(await options.getStatus()));
    } catch {
      return json({ error: "暫時無法讀取評測佇列，請稍後重試" }, 503);
    }
  };
}
