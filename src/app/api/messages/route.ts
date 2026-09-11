import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { messageSchema } from "@/lib/messageSchema";
import { enforceRateLimit } from "@/lib/rateLimit";

// 傳送站內訊息。收件者用 username 指名（跟 /messages/[username] 的網址一致）。
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const limited = enforceRateLimit(`message:${session.userId}`, 20, 60_000);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const receiver = await prisma.user.findUnique({
    where: { username: parsed.data.to },
    select: { id: true },
  });
  if (!receiver) {
    return Response.json({ error: "找不到這位使用者" }, { status: 404 });
  }
  if (receiver.id === session.userId) {
    return Response.json({ error: "不能傳訊息給自己" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.userId,
      receiverId: receiver.id,
      content: parsed.data.content,
    },
  });
  return Response.json({ id: message.id });
}
