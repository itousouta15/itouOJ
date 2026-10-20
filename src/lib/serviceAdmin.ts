import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MANAGED_SERVICES, type ManagedService, type ServiceAction, type ServiceState } from "@/lib/managedServices";

const run = promisify(execFile);

export function isServiceAction(service: string | null, action: string | null): service is ManagedService {
  return service !== null && Object.hasOwn(MANAGED_SERVICES, service) &&
    (action === "restart" || (action === "start" && service !== "website"));
}

export async function getManagedServices(): Promise<ServiceState[]> {
  return Promise.all((Object.keys(MANAGED_SERVICES) as ManagedService[]).map(async (service) => {
    const { stdout } = await run("/usr/bin/systemctl", ["show", MANAGED_SERVICES[service].unit,
      "--property=ActiveState", "--property=UnitFileState"], { timeout: 4000, maxBuffer: 1024 });
    const properties = Object.fromEntries(stdout.trim().split("\n").map((line) => line.trim().split("=", 2)));
    const state = properties.ActiveState;
    return { service, state: state === "active" || state === "inactive" || state === "failed" ? state : "unknown",
      enabled: properties.UnitFileState === "enabled" };
  }));
}

export async function manageService(service: ManagedService, action: ServiceAction) {
  // sudoers grants access only to the root-owned, argument-validating helper.
  await run("/usr/bin/sudo", ["-n", "/usr/local/sbin/oj-service-control", service, action],
    { timeout: 10_000, maxBuffer: 1024 });
}

type Session = { role: string; userId?: string } | null;
export function createServiceAdminHandler(options: {
  getSession: () => Promise<Session>;
  getStatus: () => Promise<ServiceState[]>;
  perform: (service: ManagedService, action: ServiceAction) => Promise<void>;
}) {
  const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
    "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff",
  } });
  return async (request: Request) => {
    try {
      const session = await options.getSession();
      if (session?.role !== "ADMIN") return json({ error: "需要管理員權限" }, 403);
      if (request.method === "GET") return json({ services: await options.getStatus(), sampledAt: new Date().toISOString() });
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      // Browser POSTs must originate on this host. The public nginx proxy sets Host
      // to the requested site; Next may see an HTTP URL behind its HTTPS proxy.
      const rawOrigin = request.headers.get("origin");
      const host = request.headers.get("host") ?? new URL(request.url).host;
      let origin: URL;
      try { origin = new URL(rawOrigin ?? ""); }
      catch { return json({ error: "來源不符" }, 403); }
      const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
      if (origin.host !== host || (origin.protocol !== "https:" && !(local && origin.protocol === "http:")) ||
        ![null, "same-origin"].includes(request.headers.get("sec-fetch-site"))) {
        return json({ error: "來源不符" }, 403);
      }
      const params = new URL(request.url).searchParams;
      const service = params.get("service"), action = params.get("action");
      if (!isServiceAction(service, action)) return json({ error: "不支援的服務或操作" }, 400);
      await options.perform(service, action as ServiceAction);
      console.info(JSON.stringify({ event: "admin.service_action", userId: session.userId, service, action }));
      return json({ queued: service === "website", service, action }, service === "website" ? 202 : 200);
    } catch (error) {
      console.error(JSON.stringify({ event: "admin.service_failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "服務管理暫時無法使用，請稍後重試" }, 503);
    }
  };
}
