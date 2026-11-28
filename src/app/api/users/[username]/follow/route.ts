import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rateLimit";

// POST = 追蹤、DELETE = 取消追蹤；兩邊都冪等（重複按不報錯）。
async function handle(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
  action: "follow" | "unfollow"
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const limited = enforceRateLimit(`follow:${session.userId}`, 30, 60_000);
  if (limited) return limited;

  const { username } = await params;
  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target) {
    return Response.json({ error: "找不到使用者" }, { status: 404 });
  }
  if (target.id === session.userId) {
    return Response.json({ error: "不能追蹤自己" }, { status: 400 });
  }

  if (action === "follow") {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: session.userId,
          followingId: target.id,
        },
      },
      create: { followerId: session.userId, followingId: target.id },
      update: {},
    });
  } else {
    await prisma.follow.deleteMany({
      where: { followerId: session.userId, followingId: target.id },
    });
  }

  return Response.json({ ok: true });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  return handle(request, { params }, "follow");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  return handle(request, { params }, "unfollow");
}
