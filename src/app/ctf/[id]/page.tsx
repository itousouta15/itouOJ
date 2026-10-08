import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCtfChallenge } from "@/lib/ctfChallenge";
import CtfChallengeContent from "@/components/CtfChallengeContent";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const detail = await getCtfChallenge((await params).id);
  const challenge = detail?.challenge;
  return { title: challenge?.title ?? "CTF 題目", ...(challenge ? { alternates: { canonical: `/ctf/${challenge.id}` } } : {}), ...(!challenge?.isPublic ? { robots: { index: false, follow: false } } : {}) };
}

export default async function CtfChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const detail = await getCtfChallenge((await params).id);
  if (!detail) notFound();
  return <div className="ctf-standalone mx-auto max-w-3xl"><CtfChallengeContent detail={detail} /></div>;
}
