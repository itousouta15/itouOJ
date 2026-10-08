"use client";

import CtfChallengeModal from "@/components/CtfChallengeModal";

export default function ChallengeError({ reset }: { reset: () => void }) {
  return <CtfChallengeModal titleId="ctf-challenge-error-title"><div className="space-y-4 p-8">
    <h2 id="ctf-challenge-error-title" className="section-title">無法載入題目</h2>
    <p role="alert" className="text-sm text-dim">請檢查連線後重試，或先關閉視窗。</p>
    <button className="btn-secondary" onClick={reset}>重新載入</button>
  </div></CtfChallengeModal>;
}
