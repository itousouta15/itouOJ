import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema, ctfAttemptSchema } from "@/lib/ctfSchema";
import { enforceRateLimit, clientIp } from "@/lib/rateLimit";
import { CTF_ATTEMPT_MAX_BYTES, readCtfJson, ctfErrorResponse } from "@/lib/ctfAttachment";
import { CtfAttemptError, submitCtfAttempt } from "@/lib/ctfAttempt";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  // Count both buckets, including requests rejected by the account bucket.
  const accountLimit = enforceRateLimit(`ctf:user:${session.userId}`, 10, 60000);
  const ipLimit = enforceRateLimit(`ctf:ip:${clientIp(request)}`, 30, 60000);
  if (accountLimit || ipLimit) return accountLimit ?? ipLimit!;
  const id = ctfIdSchema.safeParse((await params).id);
  if (!id.success) return Response.json({ error: "題目 ID 不合法" }, { status: 400 });
  try {
    const parsed = ctfAttemptSchema.safeParse(await readCtfJson(request, CTF_ATTEMPT_MAX_BYTES));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const result = await submitCtfAttempt(prisma, session.userId, id.data, parsed.data.flag);
    return Response.json({ result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof CtfAttemptError) return Response.json({ error: error.message }, { status: error.status });
    return ctfErrorResponse(error);
  }
}
