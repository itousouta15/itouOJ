const globalForRunLimit = globalThis as unknown as {
  __ojRunningExecutions?: Map<string, number>;
};

const running = (globalForRunLimit.__ojRunningExecutions ??= new Map());

export function acquireExecutionSlot(key: string, limit: number): boolean {
  const count = running.get(key) ?? 0;
  if (count >= limit) return false;
  running.set(key, count + 1);
  return true;
}

export function releaseExecutionSlot(key: string) {
  const count = running.get(key) ?? 0;
  if (count <= 1) running.delete(key);
  else running.set(key, count - 1);
}
