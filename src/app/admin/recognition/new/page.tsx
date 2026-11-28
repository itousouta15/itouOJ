import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import RecognitionClusterForm from "@/components/RecognitionClusterForm";

export const metadata: Metadata = { title: "新增識讀群集" };
export const dynamic = "force-dynamic";

export default async function NewRecognitionClusterPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const [problems, tags] = await Promise.all([
    prisma.problem.findMany({
      where: { type: "RECOGNITION" },
      orderBy: [{ clusterId: "asc" }, { order: "asc" }],
      select: {
        id: true,
        title: true,
        isPublic: true,
        category: true,
        cluster: { select: { id: true, title: true } },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="mb-4 page-title">新增識讀群集</h1>
      <RecognitionClusterForm
        availableTags={tags}
        problems={problems.map((p) => ({
          id: p.id,
          title: p.title,
          isPublic: p.isPublic,
          category: p.category,
          clusterId: p.cluster?.id ?? null,
          clusterTitle: p.cluster?.title ?? null,
        }))}
      />
    </div>
  );
}
