import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ProblemForm from "@/components/ProblemForm";

export const metadata: Metadata = { title: "新增題目" };
export const dynamic = "force-dynamic";

export default async function NewProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { type } = await searchParams;
  const defaultType = type === "RECOGNITION" ? "RECOGNITION" : "PROGRAMMING";

  const [tags, users] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: { username: true, displayName: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-4 page-title">
        {defaultType === "RECOGNITION" ? "新增識別題" : "新增題目"}
      </h1>
      <ProblemForm
        availableTags={tags}
        availableUsers={users}
        defaultType={defaultType}
      />
    </div>
  );
}
