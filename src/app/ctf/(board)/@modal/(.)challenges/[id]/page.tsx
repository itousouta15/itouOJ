import { notFound } from "next/navigation";
import { getCtfChallenge } from "@/lib/ctfChallenge";
import CtfChallengeContent from "@/components/CtfChallengeContent";
import CtfChallengeModal from "@/components/CtfChallengeModal";

export const dynamic = "force-dynamic";
// Intercept only the explicit challenge namespace, never history/scoreboard.
export default async function CtfModalPage({ params }: { params: Promise<{ id: string }> }) {
  const detail = await getCtfChallenge((await params).id);
  if (!detail) notFound();
  return <CtfChallengeModal key={detail.challenge.id} titleId={`ctf-challenge-title-${detail.challenge.id}`}>
    <CtfChallengeContent detail={detail} modal />
  </CtfChallengeModal>;
}
