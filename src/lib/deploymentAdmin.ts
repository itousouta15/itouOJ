import { request as httpRequest } from "node:http";
import { isAdminSameOrigin } from "@/lib/adminOrigin";

type Session = { role: string } | null;
const revision = /^[a-f0-9]{40}$/;
type DeployJob = { state: string; phase?: string; target?: string | null; startedAt?: string;
  updatedAt?: string; message?: string | null; runId?: string };
const safeJob = (value: unknown): DeployJob => {
  const job = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return { state: typeof job.state === "string" ? job.state : "unknown",
    phase: typeof job.phase === "string" ? job.phase : undefined,
    target: typeof job.target === "string" && revision.test(job.target) ? job.target : null,
    startedAt: typeof job.startedAt === "string" ? job.startedAt : undefined,
    updatedAt: typeof job.updatedAt === "string" ? job.updatedAt : undefined,
    message: typeof job.message === "string" ? job.message.slice(0, 160) : null,
    runId: typeof job.runId === "string" && /^[0-9]{1,20}$/.test(job.runId) ? job.runId : undefined };
};
export function deploymentSnapshot(data: unknown) {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return { deployed: typeof source.deployed === "string" && revision.test(source.deployed) ? source.deployed : null,
    latest: typeof source.latest === "string" && revision.test(source.latest) ? source.latest : null,
    triggerMode: source.triggerMode === "instant" ? "instant" as const : "scheduled" as const,
    job: safeJob(source.job), logs: typeof source.logs === "string" ? source.logs.slice(-32 * 1024) : "",
    previous: source.previous ? safeJob(source.previous) : null,
    previousLogs: typeof source.previousLogs === "string" ? source.previousLogs.slice(-32 * 1024) : "" };
}

export async function readDeployment(method: "GET" | "POST") {
  return new Promise<ReturnType<typeof deploymentSnapshot>>((resolve, reject) => {
    const request = httpRequest({ socketPath: "/run/oj-service-control/control.sock", path: "/deployment", method }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 256 * 1024) request.destroy(new Error("Unexpected deployment response"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        if (method === "POST") {
          if (response.statusCode === 202) {
            try { resolve(deploymentSnapshot({ ...JSON.parse(Buffer.concat(chunks).toString("utf8")), job: { state: "queued" } })); }
            catch { reject(new Error("Invalid deployment response")); }
          }
          else reject(new Error("Deployment request rejected"));
          return;
        }
        if (response.statusCode !== 200) return reject(new Error("Deployment controller unavailable"));
        try {
          resolve(deploymentSnapshot(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
        } catch { reject(new Error("Invalid deployment response")); }
      });
    });
    request.setTimeout(18_000, () => request.destroy(new Error("Deployment controller timed out")));
    request.on("error", reject);
    request.end();
  });
}

export function createDeploymentAdminHandler(options: {
  getSession: () => Promise<Session>;
  getStatus: () => ReturnType<typeof readDeployment>;
  start: () => ReturnType<typeof readDeployment>;
}) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
    "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff",
  } });
  return async (request: Request) => {
    try {
      if ((await options.getSession())?.role !== "ADMIN") return json({ error: "需要管理員權限" }, 403);
      if (request.method === "GET") return json(await options.getStatus());
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!isAdminSameOrigin(request)) return json({ error: "來源不符" }, 403);
      const result = await options.start();
      return json({ queued: true, triggerMode: result.triggerMode }, 202);
    } catch (error) {
      console.error(JSON.stringify({ event: "deploy.admin.failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "目前無法讀取或啟動部署，請檢查伺服器日誌" }, 503);
    }
  };
}
