import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import RecognitionQuestionForm from "@/components/RecognitionQuestionForm";

export const metadata: Metadata = { title: "新增程式識別題" };

export default async function NewRecognitionPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  return (
    <div>
      <h1 className="mb-4 page-title">新增程式識別題</h1>
      <RecognitionQuestionForm />
    </div>
  );
}