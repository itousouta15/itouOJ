import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SubmissionDetail from "@/components/SubmissionDetail";

export const metadata: Metadata = { title: "提交詳情" };

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submissionId = Number(id);
  if (!Number.isInteger(submissionId)) notFound();

  return <SubmissionDetail id={submissionId} />;
}
