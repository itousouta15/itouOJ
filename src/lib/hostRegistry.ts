import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";

export const HOST_TOKEN_PATTERN = /^ojh_[A-Za-z0-9_-]{43}$/;
export const HOST_HEARTBEAT_MS = 5_000;
export const HOST_OFFLINE_MS = 30_000;
export type RemoteService = "remote" | "sandbox";
export type RemoteAction = "start" | "restart";
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const newToken = () => `ojh_${randomBytes(32).toString("base64url")}`;

export function createHostRegistry(db: PrismaClient, clock = () => new Date()) {
  return {
    async authenticate(token: string) {
      if (!HOST_TOKEN_PATTERN.test(token)) return null;
      return db.managedHost.findFirst({ where: { tokenHash: digest(token), enabled: true },
        select: { id: true, name: true, role: true } });
    },
    async create(name: string, address: string, role: "PRIMARY" | "BACKUP") {
      const token = newToken();
      const host = await db.managedHost.create({ data: { name, address, role, tokenHash: digest(token) },
        select: { id: true, name: true, address: true, role: true, enabled: true } });
      return { host, token };
    },
    async list() {
      const now = clock();
      const hosts = await db.managedHost.findMany({ orderBy: { createdAt: "asc" },
        select: { id: true, name: true, address: true, role: true, enabled: true, lastSeenAt: true,
          workerState: true, sandboxState: true, commands: { orderBy: { id: "desc" }, take: 5,
            select: { id: true, service: true, action: true, state: true, createdAt: true, deliveredAt: true, finishedAt: true } } } });
      return { hosts: hosts.map((host) => ({ ...host,
        online: host.enabled && host.lastSeenAt !== null && host.lastSeenAt.getTime() > now.getTime() - HOST_OFFLINE_MS,
        commands: host.commands.map((command) => ({ ...command,
          state: command.state === "DELIVERED" && command.deliveredAt &&
            command.deliveredAt.getTime() < now.getTime() - 2 * 60_000 ? "UNKNOWN" : command.state,
        })),
      })), sampledAt: now.toISOString() };
    },
    async setEnabled(id: string, enabled: boolean) {
      return (await db.managedHost.updateMany({ where: { id }, data: { enabled } })).count === 1;
    },
    async updateDetails(id: string, address: string, role: "PRIMARY" | "BACKUP") {
      return (await db.managedHost.updateMany({ where: { id }, data: { address, role } })).count === 1;
    },
    async rotate(id: string) {
      const token = newToken();
      const updated = await db.managedHost.updateMany({ where: { id }, data: { tokenHash: digest(token),
        lastSeenAt: null, workerState: null, sandboxState: null } });
      return updated.count ? { token } : null;
    },
    async remove(id: string) {
      return (await db.managedHost.deleteMany({ where: { id } })).count === 1;
    },
    async command(hostId: string, service: RemoteService, action: RemoteAction) {
      const host = await db.managedHost.findUnique({ where: { id: hostId }, select: { enabled: true } });
      if (!host?.enabled) return null;
      // A dispatched command is never replayed automatically: a restart may
      // have happened even if its acknowledgement was lost.
      await db.hostCommand.updateMany({ where: { hostId, state: "DELIVERED",
        deliveredAt: { lt: new Date(clock().getTime() - 2 * 60_000) } }, data: { state: "UNKNOWN" } });
      if (await db.hostCommand.count({ where: { hostId, state: { in: ["PENDING", "DELIVERED"] } } })) return null;
      return db.hostCommand.create({ data: { hostId, service, action }, select: { id: true } });
    },
    async poll(hostId: string, states: { workerState: string; sandboxState: string }) {
      await db.managedHost.update({ where: { id: hostId }, data: { ...states, lastSeenAt: clock() } });
      for (let i = 0; i < 2; i++) {
        const command = await db.hostCommand.findFirst({ where: { hostId, state: "PENDING" }, orderBy: { id: "asc" },
          select: { id: true, service: true, action: true } });
        if (!command) return null;
        if ((await db.hostCommand.updateMany({ where: { id: command.id, hostId, state: "PENDING" },
          data: { state: "DELIVERED", deliveredAt: clock() } })).count === 1) return command;
      }
      return null;
    },
    async ack(hostId: string, id: number, outcome: "APPLIED" | "FAILED") {
      const updated = await db.hostCommand.updateMany({ where: { id, hostId, state: "DELIVERED" },
        data: { state: outcome, finishedAt: clock() } });
      if (updated.count) return true;
      const existing = await db.hostCommand.findFirst({ where: { id, hostId }, select: { state: true } });
      return existing?.state === outcome;
    },
  };
}
