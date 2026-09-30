// Next.js production uses one server process for /api/run and the judge worker.
// Admit only one request to the single-threaded sandbox at a time; otherwise
// its HTTP backlog counts against the execution timeout and becomes a false IE.
export type SandboxPriority = "judge" | "test";

export class SandboxBusyError extends Error {
  constructor() {
    super("評測系統忙碌中，請稍後再試");
    this.name = "SandboxBusyError";
  }
}

type Waiter = {
  queuedAt: number;
  resolve: (waitMs: number) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  onAbort?: () => void;
};

type Queue = { active: boolean; judges: Waiter[]; tests: Waiter[] };
const globalQueue = globalThis as typeof globalThis & { __ojSandboxQueue?: Queue };
const queue = (globalQueue.__ojSandboxQueue ??= {
  active: false,
  judges: [],
  tests: [],
});

const MAX_WAITING_TESTS = 2;
const MAX_WAITING_JUDGES = 4;
const TEST_WAIT_MS = 15_000;
const JUDGE_WAIT_MS = 120_000;

function discard(waiter: Waiter, list: Waiter[]) {
  const index = list.indexOf(waiter);
  if (index >= 0) list.splice(index, 1);
  clearTimeout(waiter.timer);
  if (waiter.signal && waiter.onAbort) {
    waiter.signal.removeEventListener("abort", waiter.onAbort);
  }
}

function release() {
  const next = queue.judges.shift() ?? queue.tests.shift();
  if (!next) {
    queue.active = false;
    return;
  }
  discard(next, []);
  // Keep active=true until the next holder completes, including the microtask
  // between resolve() and its callback. This prevents overlapping sandboxes.
  next.resolve(performance.now() - next.queuedAt);
}

export async function withSandboxTurn<T>(
  priority: SandboxPriority,
  work: (queueMs: number) => Promise<T>,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) throw new SandboxBusyError();
  let queueMs = 0;
  if (queue.active || queue.judges.length > 0) {
    const list = priority === "judge" ? queue.judges : queue.tests;
    const max = priority === "judge" ? MAX_WAITING_JUDGES : MAX_WAITING_TESTS;
    if (list.length >= max) throw new SandboxBusyError();
    queueMs = await new Promise<number>((resolve, reject) => {
      const queuedAt = performance.now();
      const waiter: Waiter = {
        queuedAt,
        resolve,
        reject,
        timer: setTimeout(() => {
          discard(waiter, list);
          reject(new SandboxBusyError());
        }, priority === "judge" ? JUDGE_WAIT_MS : TEST_WAIT_MS),
        signal,
      };
      waiter.onAbort = () => {
        discard(waiter, list);
        reject(new SandboxBusyError());
      };
      signal?.addEventListener("abort", waiter.onAbort, { once: true });
      list.push(waiter);
    });
  } else {
    queue.active = true;
  }

  try {
    return await work(queueMs);
  } finally {
    release();
  }
}
