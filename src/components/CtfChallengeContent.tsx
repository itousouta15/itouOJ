import Link from "next/link";
import { ctfDate } from "@/lib/ctf";
import { CTF_DIFFICULTIES } from "@/lib/ctfSchema";
import type { CtfChallengeDetail } from "@/lib/ctfChallenge";
import Markdown from "@/components/Markdown";
import CtfFlagForm from "@/components/CtfFlagForm";
import CtfChallengeTabs from "@/components/CtfChallengeTabs";

export default function CtfChallengeContent({ detail, modal = false }: { detail: CtfChallengeDetail; modal?: boolean }) {
  const { challenge, session } = detail;
  const solve = challenge.solves[0];
  const Title = modal ? "h2" : "h1";
  return (
    <div className="ctf-challenge-content">
      <CtfChallengeTabs key={challenge.id} challengeId={challenge.id} solveCount={challenge._count.solves} loggedIn={Boolean(session)}>
        <header className="ctf-challenge-heading">
          <Title id={`ctf-challenge-title-${challenge.id}`} className="ctf-challenge-title">{challenge.title}</Title>
          <p className="ctf-challenge-points">{challenge.points}<span> 分</span></p>
          <div className="ctf-challenge-badges">
            <span className="pill">{challenge.category}</span>
            <span className="pill">{CTF_DIFFICULTIES[challenge.difficulty as keyof typeof CTF_DIFFICULTIES]}</span>
            {solve && <span className="pill ctf-solved-badge">✓ 已解出</span>}
          </div>
          {!challenge.isPublic && <p className="mt-3 text-sm text-dim">隱藏題目預覽，公開後才能提交。</p>}
          {session?.role === "ADMIN" && <Link className="mt-3 inline-block text-xs text-blue hover:underline" href={`/admin/ctf/${challenge.id}/edit`}>編輯題目 →</Link>}
        </header>
        <div className="ctf-challenge-description"><Markdown>{challenge.description}</Markdown></div>
        {challenge.labType && <div className="ctf-challenge-connection">
          <p className="mb-3 text-sm text-dim">開啟練習網站探索線索，找到 Flag 後回到這裡提交。</p>
          <a className="btn-primary inline-flex" href={`/ctf/labs/${challenge.id}`} target="_blank" rel="noopener noreferrer">前往練習網站 ↗</a>
        </div>}
        {challenge.attachments.length > 0 && <section className="ctf-challenge-files" aria-label="附件下載">
          {challenge.attachments.map((file) => <a key={file.id} className="ctf-file-button" href={`/api/ctf/challenges/${challenge.id}/attachments/${file.id}`}>
            <span aria-hidden="true">↓</span><span className="min-w-0 break-all">{file.filename}<small className="block text-xs text-dim">{(file.sizeBytes / 1024).toFixed(1)} KiB</small></span>
          </a>)}
        </section>}
        <section className="ctf-challenge-submit" aria-label="提交 Flag">
          {solve && <p className="mb-3 text-xs text-dim">首次解出：{ctfDate(solve.solvedAt)}</p>}
          {!challenge.isPublic ? <p className="text-sm text-mute">公開題目後才能提交。</p>
            : session ? <CtfFlagForm key={challenge.id} challengeId={challenge.id} solved={Boolean(solve)} inline />
            : <Link className="btn-primary" href={`/login?next=${encodeURIComponent(`/ctf/${challenge.id}`)}`}>登入後提交</Link>}
        </section>
      </CtfChallengeTabs>
    </div>
  );
}
