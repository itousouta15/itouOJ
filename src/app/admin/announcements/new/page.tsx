import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AnnouncementForm from "@/components/AnnouncementForm";

export const metadata: Metadata = { title: "新增公告" };

export default async function NewAnnouncementPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  return (
    <div>
      <h1 className="mb-4 page-title">新增公告</h1>
      <AnnouncementForm />
    </div>
  );
}
