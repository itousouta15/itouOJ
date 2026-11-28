import CtfChallengeModal from "@/components/CtfChallengeModal";

export default function MissingChallenge() {
  return <CtfChallengeModal titleId="ctf-challenge-missing-title"><div className="p-8">
    <h2 id="ctf-challenge-missing-title" className="section-title">題目不存在或已隱藏</h2>
    <p className="mt-4 text-sm text-dim">請關閉視窗，重新載入題庫。</p>
  </div></CtfChallengeModal>;
}
