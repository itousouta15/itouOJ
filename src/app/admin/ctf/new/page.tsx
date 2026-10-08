import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CtfChallengeForm from "@/components/CtfChallengeForm";

export const metadata: Metadata = { title: "新增 CTF 題目" };
export const dynamic = "force-dynamic";
export default async function NewCtfPage() {
  if ((await getSession())?.role !== "ADMIN") redirect("/");
  return <div className="mx-auto max-w-3xl space-y-5"><h1 className="page-title">新增 CTF 題目</h1><CtfChallengeForm /></div>;
}
