export async function register() {
  // Production uses the separately supervised systemd worker. Keep a small
  // worker in next dev so local submissions do not remain PENDING forever.
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_RUNTIME === "edge"
  ) {
    return;
  }

  const globalForJudge = globalThis as typeof globalThis & {
    devJudgeWorkerStarted?: boolean;
  };
  if (globalForJudge.devJudgeWorkerStarted) return;
  globalForJudge.devJudgeWorkerStarted = true;

  const { claimAndJudgeOne, recoverStaleJudgingSubmissions } = await import(
    "@/lib/judge"
  );
  await recoverStaleJudgingSubmissions();

  void (async () => {
    while (true) {
      try {
        const submissionId = await claimAndJudgeOne();
        if (submissionId === null) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error("[judge] local worker failed:", error);
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  })();
}
