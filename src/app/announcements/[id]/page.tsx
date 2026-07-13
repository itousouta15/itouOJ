import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Markdown from "@/components/Markdown";

export const dynamic = "force-dynamic";

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) notFound();

  const session = await getSession();
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          {announcement.isPinned && (
            <span className="vbadge vbadge-green">置頂</span>
          )}
          <h1 className="page-title">{announcement.title}</h1>
          {session?.role === "ADMIN" && (
            <Link
              href={`/admin/announcements/${announcement.id}/edit`}
              className="text-sm text-blue hover:underline"
            >
              編輯公告
            </Link>
          )}
        </div>
        <p className="mono mt-1 text-xs text-mute">
          {announcement.createdAt.toLocaleString("zh-TW", {
            timeZone: "Asia/Taipei",
            hour12: false,
          })}
        </p>
      </div>

      <div className="card p-6">
        <Markdown>{announcement.content}</Markdown>
      </div>
    </div>
  );
}
