import { timingSafeEqual } from "node:crypto";
import { claimAndJudgeOne, recoverStaleJudgingSubmissions } from "@/lib/judge";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = process.env.JUDGE_WORKER_SECRET;
  const received = request.headers.get("x-judge-worker-secret");
  if (!expected || !received) return false;
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  return (
    expectedBytes.length === receivedBytes.length &&
    timingSafeEqual(expectedBytes, receivedBytes)
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const action = new URL(request.url).searchParams.get("action");
  if (action === "recover") {
    const result = await recoverStaleJudgingSubmissions();
    return Response.json({ recovered: result.count });
  }
  if (action !== "work") {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  const submissionId = await claimAndJudgeOne();
  return Response.json({ submissionId, processed: submissionId !== null });
}
