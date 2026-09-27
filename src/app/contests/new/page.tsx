import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ContestForm from "@/components/ContestForm";

export const metadata: Metadata = { title: "建立比賽" };
export const dynamic = "force-dynamic";

export default async function NewContestPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/contests/new");

  const problems = await prisma.problem.findMany({
    where: { isPublic: true },
    orderBy: [{ type: "asc" }, { problemCode: "asc" }],
    select: { id: true, title: true, isPublic: true, type: true },
  });

  return (
    <div>
      <h1 className="mb-4 page-title">建立比賽</h1>
      <ContestForm problems={problems} createEndpoint="/api/contests" isAdmin={false} />
    </div>
  );
}
