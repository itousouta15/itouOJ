import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CourseForm from "@/components/CourseForm";

export const metadata: Metadata = { title: "新增課程" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
    select: { id: true, title: true, isPublic: true },
  });

  return (
    <div>
      <h1 className="mb-4 page-title">新增課程</h1>
      <CourseForm problems={problems} />
    </div>
  );
}
