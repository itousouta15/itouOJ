import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ProblemForm from "@/components/ProblemForm";

export const metadata: Metadata = { title: "新增題目" };

export default async function NewProblemPage() {
  const session = await getSession();
  if (session?.role !== "ADMIN") redirect("/");

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">新增題目</h1>
      <ProblemForm />
    </div>
  );
}
