import { request as httpRequest } from "node:http";

const services = new Set(["website", "admin", "proxy", "worker", "sandbox", "interactive", "control"]);

function readControllerLogs(service: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = httpRequest({ socketPath: "/run/oj-service-control/control.sock", path: `/logs/${service}`, method: "GET" }, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error("Log controller unavailable"));
        return;
      }
      let size = 0;
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 768 * 1024) request.destroy(new Error("Log response too large"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch (error) { reject(error); }
      });
    });
    request.setTimeout(5500, () => request.destroy(new Error("Log read timed out")));
    request.on("error", reject);
    request.end();
  });
}

export function createServiceLogsHandler(
  getSession: () => Promise<{ role: string } | null>,
  getLogs = readControllerLogs,
) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
    "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff",
  } });
  return async (request: Request) => {
    try {
      if ((await getSession())?.role !== "ADMIN") return json({ error: "需要管理員權限" }, 403);
      const service = new URL(request.url).searchParams.get("service");
      if (!service || !services.has(service)) return json({ error: "不支援的紀錄來源" }, 400);
      return json(await getLogs(service));
    } catch {
      return json({ error: "暫時無法讀取伺服器紀錄，請稍後重試" }, 503);
    }
  };
}
