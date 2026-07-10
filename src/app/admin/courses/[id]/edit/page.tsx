import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import CourseForm from "@/components/CourseForm";

export const metadata: Metadata = { title: "編輯課程" };
export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) notFound();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      problems: { orderBy: [{ order: "asc" }, { id: "asc" }] },
    },
  });
  if (!course) notFound();

  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
    select: { id: true, title: true, isPublic: true },
  });

  return (
    <div>
      <h1 className="mb-4 page-title">編輯課程</h1>
      <CourseForm
        problems={problems}
        initial={{
          id: course.id,
          title: course.title,
          description: course.description,
          isPublic: course.isPublic,
          joinCode: course.joinCode ?? "",
          problemIds: course.problems.map((p) => p.problemId),
        }}
      />
    </div>
  );
}
