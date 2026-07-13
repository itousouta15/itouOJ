import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import AnnouncementForm from "@/components/AnnouncementForm";

export const metadata: Metadata = { title: "編輯公告" };
export const dynamic = "force-dynamic";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const announcementId = Number(id);
  if (!Number.isInteger(announcementId)) notFound();

  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement) notFound();

  return (
    <div>
      <h1 className="mb-4 page-title">編輯公告</h1>
      <AnnouncementForm
        initial={{
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          isPinned: announcement.isPinned,
        }}
      />
    </div>
  );
}
