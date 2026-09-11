import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Avatar from "@/components/Avatar";

export const metadata: Metadata = { title: "站內訊息" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const me = session.userId;

  // 對話列表不需要撈出所有訊息：對每個對話對象只取「最後一則」（id 最大）
  // 的分組，再把那些 id 抓回來，配未讀數組成列表。
  const [sentGroups, recvGroups, unreadGroups] = await Promise.all([
    prisma.message.groupBy({
      by: ["receiverId"],
      where: { senderId: me },
      _max: { id: true },
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: me },
      _max: { id: true },
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: { receiverId: me, readAt: null },
      _count: { _all: true },
    }),
  ]);

  const lastIds = [
    ...sentGroups.map((g) => g._max.id),
    ...recvGroups.map((g) => g._max.id),
  ].filter((id): id is number => id != null);

  const lastMessages = await prisma.message.findMany({
    where: { id: { in: lastIds } },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      receiverId: true,
    },
  });

  // 對方 id -> 最後一則訊息
  const lastByPartner = new Map<string, (typeof lastMessages)[number]>();
  for (const m of lastMessages) {
    const partnerId = m.senderId === me ? m.receiverId : m.senderId;
    const current = lastByPartner.get(partnerId);
    if (!current || m.id > current.id) lastByPartner.set(partnerId, m);
  }

  const partnerIds = [...lastByPartner.keys()];
  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      role: true,
    },
  });
  const partnerById = new Map(partners.map((p) => [p.id, p]));

  const unreadBySender = new Map(
    unreadGroups.map((g) => [g.senderId, g._count._all])
  );

  const conversations = partnerIds
    .map((id) => {
      const user = partnerById.get(id);
      const last = lastByPartner.get(id);
      if (!user || !last) return null;
      return {
        user,
        last,
        unread: unreadBySender.get(id) ?? 0,
      };
    })
    .filter((c) => c !== null)
    .sort((a, b) => b.last.id - a.last.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">站內訊息</h1>
        <p className="text-sm text-dim">一對一私訊，僅雙方看得到。</p>
      </div>

      <div className="card">
        {conversations.length === 0 && (
          <p className="py-10 text-center text-sm text-mute">
            還沒有訊息。到別人的個人頁點「傳訊息」開始對話吧。
          </p>
        )}
        {conversations.map((c) => {
          const mine = c.last.senderId === me;
          return (
            <Link
              key={c.user.id}
              href={`/messages/${c.user.username}`}
              className="flex items-center gap-3 border-b border-bd px-4 py-3 last:border-b-0 hover:bg-panel2"
            >
              <Avatar
                name={c.user.displayName || c.user.username}
                src={c.user.avatarUrl}
                size={44}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-tx">
                    {c.user.displayName || c.user.username}
                  </span>
                  {c.user.role === "ADMIN" && (
                    <span className="vbadge vbadge-purple">管理員</span>
                  )}
                </div>
                <p className="truncate text-sm text-dim">
                  {mine && <span className="text-mute">你：</span>}
                  {c.last.content}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="mono text-xs text-mute">
                  {c.last.createdAt.toLocaleString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    hour12: false,
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-[#ff6b6b] px-2 py-0.5 text-xs font-semibold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
