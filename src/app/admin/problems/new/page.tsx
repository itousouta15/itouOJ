import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProblemForm from "@/components/ProblemForm";

export const metadata: Metadata = { title: "新增題目" };

export default async function NewProblemPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-4 page-title">新增題目</h1>
      <ProblemForm availableTags={tags} />
    </div>
  );
}
