import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "公告" };
export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="mb-4 page-title">公告</h1>
      <div className="space-y-3">
        {announcements.length === 0 && (
          <p className="card p-10 text-center text-sm text-mute">
            還沒有公告
          </p>
        )}
        {announcements.map((a) => (
          <Link
            key={a.id}
            href={`/announcements/${a.id}`}
            className="card block p-5 hover:bg-panel2"
          >
            <div className="flex flex-wrap items-center gap-2">
              {a.isPinned && <span className="vbadge vbadge-green">置頂</span>}
              <h2 className="font-semibold text-tx">{a.title}</h2>
            </div>
            <p className="mono mt-2 text-xs text-mute">
              {a.createdAt.toLocaleString("zh-TW", {
                timeZone: "Asia/Taipei",
                hour12: false,
              })}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
