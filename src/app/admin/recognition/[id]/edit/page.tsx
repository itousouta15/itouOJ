import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import RecognitionClusterForm from "@/components/RecognitionClusterForm";

export const metadata: Metadata = { title: "編輯識讀群集" };
export const dynamic = "force-dynamic";

export default async function EditRecognitionClusterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const clusterId = Number(id);
  if (!Number.isInteger(clusterId)) notFound();

  const [cluster, problems, tags] = await Promise.all([
    prisma.recognitionCluster.findUnique({
      where: { id: clusterId },
      include: {
        problems: { select: { id: true } },
        tags: { select: { tagId: true } },
      },
    }),
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
  if (!cluster) notFound();

  return (
    <div>
      <h1 className="mb-4 page-title">編輯識讀群集：{cluster.title}</h1>
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
        initial={{
          id: cluster.id,
          title: cluster.title,
          description: cluster.description,
          isPublic: cluster.isPublic,
          problemIds: cluster.problems.map((p) => p.id),
          tagIds: cluster.tags.map((t) => t.tagId),
        }}
      />
    </div>
  );
}
