import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ctfPublicSelect } from "@/lib/ctf";
import { ctfIdSchema } from "@/lib/ctfSchema";
import CtfChallengeForm from "@/components/CtfChallengeForm";
import CtfAttachmentManager from "@/components/CtfAttachmentManager";

export const metadata: Metadata = { title: "編輯 CTF 題目" };
export const dynamic = "force-dynamic";
export default async function EditCtfPage({ params }: { params: Promise<{ id: string }> }) {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  const id = ctfIdSchema.safeParse((await params).id);
  if (!id.success) notFound();
  const challenge = await prisma.ctfChallenge.findUnique({
    where: { id: id.data }, select: { ...ctfPublicSelect, attachments: { select: { id: true, filename: true, sizeBytes: true }, orderBy: { id: "asc" } } },
  });
  if (!challenge) notFound();
  return <div className="mx-auto max-w-3xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="page-title">編輯 CTF 題目</h1><Link className="btn-secondary" href={`/ctf/${challenge.id}`}>預覽題目</Link></div>
    <CtfChallengeForm initial={{ id: challenge.id, title: challenge.title, description: challenge.description, category: challenge.category, difficulty: challenge.difficulty, points: challenge.points, isPublic: challenge.isPublic, order: challenge.order, labType: challenge.labType }} />
    <CtfAttachmentManager challengeId={challenge.id} attachments={challenge.attachments} />
  </div>;
}
