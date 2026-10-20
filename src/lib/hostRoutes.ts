import { z } from "zod";
import type { createHostRegistry } from "@/lib/hostRegistry";
import { isAdminSameOrigin } from "@/lib/adminOrigin";
import { JudgeProtocolError, readJudgeJson } from "@/lib/judgeWire";
import type { ServiceState } from "@/lib/managedServices";

type Registry = ReturnType<typeof createHostRegistry>;
type Session = { role: string } | null;
const id = z.string().min(1).max(64).regex(/^[a-z0-9]+$/);
const command = z.object({ action: z.literal("command"), id,
  service: z.enum(["remote", "sandbox"]), operation: z.enum(["start", "restart"]) }).strict();
const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(1).max(64),
    address: z.string().trim().min(1).max(255), role: z.enum(["PRIMARY", "BACKUP"]) }).strict(),
  z.object({ action: z.literal("setEnabled"), id, enabled: z.boolean() }).strict(),
  z.object({ action: z.literal("updateDetails"), id, address: z.string().trim().min(1).max(255),
    role: z.enum(["PRIMARY", "BACKUP"]) }).strict(),
  z.object({ action: z.literal("rotate"), id }).strict(),
  z.object({ action: z.literal("remove"), id }).strict(), command,
]);
const pollInput = z.object({ workerState: z.enum(["active", "inactive", "failed", "unknown"]),
  sandboxState: z.enum(["active", "inactive", "failed", "unknown"]) }).strict();
const ackInput = z.object({ commandId: z.number().int().positive(), outcome: z.enum(["APPLIED", "FAILED"]) }).strict();
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
  "Cache-Control": "no-store, private", Vary: "Cookie", "X-Content-Type-Options": "nosniff",
} });

export function createHostAdminHandler(options: {
  getSession: () => Promise<Session>;
  registry: Registry;
  getLocalServices: () => Promise<ServiceState[]>;
}) {
  return async (request: Request) => {
    try {
      if ((await options.getSession())?.role !== "ADMIN") return json({ error: "需要管理員權限" }, 403);
      if (request.method === "GET") {
        const [snapshot, services] = await Promise.all([options.registry.list(), options.getLocalServices()]);
        const state = (service: ServiceState["service"]) => services.find((row) => row.service === service)?.state ?? "unknown";
        const local = { id: "local", kind: "LOCAL" as const, name: "網站主機（本機）",
          address: request.headers.get("host") ?? new URL(request.url).host,
          role: "PRIMARY", enabled: true, online: true, lastSeenAt: snapshot.sampledAt,
          workerState: state("worker"), sandboxState: state("sandbox"), commands: [] };
        return json({ ...snapshot, hosts: [local, ...snapshot.hosts.map((host) => ({ ...host, kind: "REMOTE" as const }))] });
      }
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      if (!isAdminSameOrigin(request)) return json({ error: "來源不符" }, 403);
      const parsed = input.parse(await readJudgeJson(request, 1024));
      if (parsed.action === "create") return json(await options.registry.create(parsed.name, parsed.address, parsed.role), 201);
      if (parsed.action === "setEnabled") return (await options.registry.setEnabled(parsed.id, parsed.enabled)) ? json({ ok: true }) : json({ error: "主機不存在" }, 404);
      if (parsed.action === "updateDetails") return (await options.registry.updateDetails(parsed.id, parsed.address, parsed.role)) ? json({ ok: true }) : json({ error: "主機不存在" }, 404);
      if (parsed.action === "rotate") {
        const rotated = await options.registry.rotate(parsed.id);
        return rotated ? json(rotated) : json({ error: "主機不存在" }, 404);
      }
      if (parsed.action === "remove") return (await options.registry.remove(parsed.id)) ? json({ ok: true }) : json({ error: "主機不存在" }, 404);
      const queued = await options.registry.command(parsed.id, parsed.service, parsed.operation);
      return queued ? json({ commandId: queued.id }, 202) : json({ error: "主機未啟用或已有待處理操作" }, 409);
    } catch (error) {
      if (error instanceof z.ZodError) return json({ error: "無效的主機資料" }, 400);
      if (error instanceof JudgeProtocolError) return json({ error: "無效的請求" }, error.status);
      if ((error as { code?: string }).code === "P2002") return json({ error: "主機名稱已存在或已有待處理操作" }, 409);
      console.error(JSON.stringify({ event: "host.admin.failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "主機管理暫時無法使用" }, 503);
    }
  };
}

export function createHostAgentHandler(options: { registry: Registry }) {
  return async (request: Request) => {
    try {
      const token = request.headers.get("x-judge-worker-secret") ?? "";
      const host = await options.registry.authenticate(token);
      if (!host) return json({ error: "Not found" }, 404);
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const action = new URL(request.url).searchParams.get("action");
      if (action === "poll") {
        const states = pollInput.parse(await readJudgeJson(request, 1024));
        return json({ command: await options.registry.poll(host.id, states) });
      }
      if (action === "ack") {
        const { commandId, outcome } = ackInput.parse(await readJudgeJson(request, 1024));
        return (await options.registry.ack(host.id, commandId, outcome)) ? json({ ok: true }) : json({ error: "Command not found" }, 409);
      }
      return json({ error: "Unknown action" }, 400);
    } catch (error) {
      if (error instanceof z.ZodError) return json({ error: "Invalid payload" }, 400);
      if (error instanceof JudgeProtocolError) return json({ error: "Invalid payload" }, error.status);
      console.error(JSON.stringify({ event: "host.agent.failed", error: error instanceof Error ? error.name : "Unknown" }));
      return json({ error: "Host coordinator unavailable" }, 503);
    }
  };
}
