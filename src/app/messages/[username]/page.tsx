import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { avatarSrc } from "@/lib/avatar";
import Avatar from "@/components/Avatar";
import AutoRefresh from "@/components/AutoRefresh";
import MessageComposer from "@/components/MessageComposer";

export const metadata: Metadata = { title: "站內訊息" };
export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return date.toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { username } = await params;
  const other = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      avatarUpdatedAt: true,
      role: true,
    },
  });
  if (!other) notFound();
  if (other.id === session.userId) redirect("/messages");

  // 只取最近 200 則（往前比較久的訊息之後有需要再做分頁）
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.userId, receiverId: other.id },
        { senderId: other.id, receiverId: session.userId },
      ],
    },
    orderBy: { id: "desc" },
    take: 200,
    select: {
      id: true,
      senderId: true,
      content: true,
      createdAt: true,
    },
  });
  const messages = rows.reverse();

  // 打開對話就把對方送來的未讀訊息標成已讀
  await prisma.message.updateMany({
    where: { senderId: other.id, receiverId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="text-sm text-blue hover:underline">
            ← 回訊息
          </Link>
          <Link
            href={`/users/${other.username}`}
            className="flex items-center gap-2"
          >
            <Avatar
              name={other.displayName || other.username}
              src={avatarSrc(other)}
              size={36}
            />
            <span className="font-semibold text-tx hover:text-blue hover:underline">
              {other.displayName || other.username}
            </span>
          </Link>
          {other.role === "ADMIN" && (
            <span className="vbadge vbadge-purple">管理員</span>
          )}
        </div>
        <AutoRefresh intervalMs={10000} showLabel={false} />
      </div>

      <div className="card space-y-3 p-4">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-mute">
            還沒有訊息，從下面開始打招呼吧。
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === session.userId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "bg-blue text-white" : "bg-inset text-tx"
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{m.content}</p>
                <p
                  className={`mono mt-1 text-[10px] ${
                    mine ? "text-white/70" : "text-mute"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <MessageComposer to={other.username} />
    </div>
  );
}
