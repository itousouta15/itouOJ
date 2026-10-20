import { request as httpRequest } from "node:http";
import { isAdminSameOrigin } from "@/lib/adminOrigin";

type Session = { role: string } | null;
const revision = /^[a-f0-9]{40}$/;
type DeployJob = { state: string; phase?: string; target?: string | null; startedAt?: string;
  updatedAt?: string; message?: string | null };

export async function readDeployment(method: "GET" | "POST") {
  return new Promise<{ deployed: string | null; latest: string | null; job: DeployJob }>((resolve, reject) => {
    const request = httpRequest({ socketPath: "/run/oj-service-control/control.sock", path: "/deployment", method }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 4096) request.destroy(new Error("Unexpected deployment response"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        if (method === "POST") {
          if (response.statusCode === 202) resolve({ deployed: null, latest: null, job: { state: "queued" } });
          else reject(new Error("Deployment request rejected"));
          return;
        }
        if (response.statusCode !== 200) return reject(new Error("Deployment controller unavailable"));
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          const job = data.job && typeof data.job === "object" ? data.job : {};
          resolve({ deployed: revision.test(data.deployed) ? data.deployed : null,
            latest: revision.test(data.latest) ? data.latest : null,
            job: { state: typeof job.state === "string" ? job.state : "unknown",
              phase: typeof job.phase === "string" ? job.phase : undefined,
              target: revision.test(job.target) ? job.target : null,
              startedAt: typeof job.startedAt === "string" ? job.startedAt : undefined,
              updatedAt: typeof job.updatedAt === "string" ? job.updatedAt : undefined,
              message: typeof job.message === "string" ? job.message.slice(0, 160) : null } });
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
      await options.start();
      return json({ queued: true }, 202);
    } catch (error) {
      console.error(JSON.stringify({ event: "deploy.admin.failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "目前無法讀取或啟動部署，請檢查伺服器日誌" }, 503);
    }
  };
}
