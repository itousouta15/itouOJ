export const MANAGED_SERVICES = {
  website: { label: "網站", unit: "online-judge.service" },
  worker: { label: "評測 worker", unit: "online-judge-worker.service" },
  sandbox: { label: "評測 sandbox", unit: "sandbox-server.service" },
} as const;
export type ManagedService = keyof typeof MANAGED_SERVICES;
export type ServiceAction = "start" | "restart";
export type ServiceState = { service: ManagedService; state: "active" | "inactive" | "failed" | "unknown"; enabled: boolean };
