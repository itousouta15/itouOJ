import { z } from "zod";
import { getSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";
import { terminalRequest } from "@/lib/terminal";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };
const inputSchema = z.object({ text: z.string().max(65536).default(""), eof: z.boolean().default(false) });

async function handle(request: Request, context: Context) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const { id } = await context.params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(id)) {
    return Response.json({ error: "無效的工作階段" }, { status: 400 });
  }
  // Leave DELETE available even when an input/output client hits its rate limit.
  if (request.method !== "DELETE") {
    const limited = enforceRateLimit(`terminal-io:${session.userId}`, 360, 60_000);
    if (limited) return limited;
  }
  if (request.method === "GET") {
    const cursor = new URL(request.url).searchParams.get("cursor") ?? "0";
    if (!/^\d{1,8}$/.test(cursor)) return Response.json({ error: "無效的輸出位置" }, { status: 400 });
    return terminalRequest(session.userId, `/sessions/${id}?cursor=${cursor}`);
  }
  if (request.method === "POST") {
    const parsed = inputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "輸入過長或格式錯誤" }, { status: 400 });
    return terminalRequest(session.userId, `/sessions/${id}`, {
      method: "POST", body: JSON.stringify(parsed.data),
    });
  }
  return terminalRequest(session.userId, `/sessions/${id}`, { method: "DELETE" });
}

export { handle as GET, handle as POST, handle as DELETE };
