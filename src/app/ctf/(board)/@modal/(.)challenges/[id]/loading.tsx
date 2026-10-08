import CtfChallengeModal from "@/components/CtfChallengeModal";

export default function LoadingChallenge() {
  return <CtfChallengeModal titleId="ctf-challenge-loading-title">
    <div className="p-8"><h2 id="ctf-challenge-loading-title" className="section-title">載入題目中…</h2><p role="status" className="mt-4 text-sm text-dim">正在取得題目資料</p></div>
  </CtfChallengeModal>;
}
