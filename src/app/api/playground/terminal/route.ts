import { getSession } from "@/lib/auth";
import { playgroundLimits } from "@/lib/playground";
import { playgroundTerminalSchema } from "@/lib/playgroundRequest";
import { enforceRateLimit } from "@/lib/rateLimit";
import { terminalRequest } from "@/lib/terminal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const limited = enforceRateLimit(`terminal-start:${session.userId}`, 12, 60_000);
  if (limited) return limited;
  const parsed = playgroundTerminalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { language, code } = parsed.data;
  const limits = playgroundLimits(language);
  return terminalRequest(session.userId, "/sessions", {
    method: "POST",
    body: JSON.stringify({ language, code, memoryMb: limits.memoryMb, cpuMs: limits.timeMs }),
  });
}
