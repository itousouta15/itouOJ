export const MANAGED_SERVICES = {
  website: { label: "網站", unit: "online-judge.service" },
  proxy: { label: "網站入口（nginx）", unit: "nginx.service" },
  worker: { label: "評測 worker", unit: "online-judge-worker.service" },
  sandbox: { label: "評測 sandbox", unit: "sandbox-server.service" },
  interactive: { label: "互動終端", unit: "sandbox-interactive.service" },
} as const;
export type ManagedService = keyof typeof MANAGED_SERVICES;
export type ServiceAction = "start" | "restart" | "reload";
export type ServiceState = { service: ManagedService; state: "active" | "inactive" | "failed" | "unknown"; enabled: boolean };
