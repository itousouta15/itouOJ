import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ContestForm from "@/components/ContestForm";

export const metadata: Metadata = { title: "新增比賽" };
export const dynamic = "force-dynamic";

export default async function NewContestPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const problems = await prisma.problem.findMany({
    orderBy: { id: "asc" },
    select: { id: true, title: true, isPublic: true },
  });

  return (
    <div>
      <h1 className="mb-4 page-title">新增比賽</h1>
      <ContestForm problems={problems} />
    </div>
  );
}
