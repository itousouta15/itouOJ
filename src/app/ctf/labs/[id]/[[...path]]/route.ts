import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfIdSchema, CTF_LAB_TYPES } from "@/lib/ctfSchema";
import { CtfRequestError, ctfErrorResponse, readCtfBody } from "@/lib/ctfAttachment";
import { CtfLabFlagError } from "@/lib/ctfLabFlag";
import { ctfLabCookie, ctfLabHtml, renderCtfLab } from "@/lib/ctfLab";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string; path?: string[] }> };

async function getLab(id: string) {
  const parsed = ctfIdSchema.safeParse(id);
  if (!parsed.success) return null;
  const session = await getSession();
  return prisma.ctfChallenge.findFirst({
    where: { id: parsed.data, labType: { in: [...CTF_LAB_TYPES] }, ...(session?.role === "ADMIN" ? {} : { isPublic: true }) },
    select: { id: true, title: true, labType: true, flagHash: true, labFlagCiphertext: true },
  });
}

export async function GET(request: Request, { params }: Context) {
  const { id, path = [] } = await params;
  const challenge = await getLab(id);
  if (!challenge?.labFlagCiphertext) return Response.json({ error: "練習網站不存在" }, { status: 404 });
  try { return renderCtfLab(request, challenge, path); }
  catch (error) {
    if (error instanceof CtfLabFlagError) return ctfLabHtml(challenge, "Web Lab", "<h1>練習網站暫時無法開啟</h1><p>請管理員重新設定這題的 Flag。</p>", { status: 503 });
    throw error;
  }
}

export async function POST(request: Request, { params }: Context) {
  const { id, path = [] } = await params;
  const challenge = await getLab(id);
  if (!challenge?.labFlagCiphertext) return Response.json({ error: "練習網站不存在" }, { status: 404 });
  if (challenge.labType !== "COOKIE" || path.length !== 1 || !["login", "logout"].includes(path[0])) {
    return Response.json({ error: "此頁面不接受提交" }, { status: 405, headers: { Allow: "GET" } });
  }
  const secure = new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  try {
    const bytes = await readCtfBody(request, 8192);
    if (path[0] === "login") {
      if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) throw new CtfRequestError("請使用網站的登入表單");
      const fields = new URLSearchParams(new TextDecoder().decode(bytes));
      if (fields.get("username") !== "guest" || fields.get("password") !== "guest") {
        return ctfLabHtml(challenge, "北風社員站", `<h1>登入失敗</h1><p>請使用迎新訪客帳號。</p><a href="/ctf/labs/${challenge.id}">返回登入頁</a>`, { status: 403 });
      }
    }
    // Intentionally editable fake role, scoped to this lab. No OJ session writes.
    return new Response(null, { status: 303, headers: {
      Location: `/ctf/labs/${challenge.id}`,
      "Set-Cookie": ctfLabCookie(challenge.id, "guest", secure, path[0] === "logout"),
      "Cache-Control": "private, no-store",
    } });
  } catch (error) { return ctfErrorResponse(error); }
}
