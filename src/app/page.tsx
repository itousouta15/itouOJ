import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getNavInfo } from "@/lib/nav";
import { getHomeData } from "@/lib/home";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";
import DifficultyBadge from "@/components/DifficultyBadge";
import FeedList from "@/components/FeedList";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "itouOJ | 實作、識讀與 CTF 練習平台" },
  description: "程式實作、APCS 識讀與 CTF 練習，共用一個帳號。挑一題，從第一個 AC 或 Flag 開始。",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const nav = await getNavInfo();
  const data = await getHomeData(nav);
  const stats = [
    { label: "實作題", value: data.programmingCount },
    { label: "識讀題", value: data.recognitionCount },
    { label: "CTF 挑戰", value: data.ctfCount },
    { label: "使用者", value: data.userCount },
  ];

  return (
    <div className="homepage-simple" data-app-section="root">
      <section className="homepage-simple-hero" data-app-section="hero">
        <Image src="/brand/itouOJ.png" alt="itouOJ" width={72} height={72} loading="eager" />
        <h1>寫程式、讀邏輯、找出 Flag</h1>
        <p>實作、識讀與 CTF，共用一個帳號。<br />挑一題，從你的第一個 AC 或 Flag 開始。</p>
        <nav aria-label="開始練習" className="homepage-simple-actions">
          <Link href="/problems" className="btn-primary" data-home-practice>實作題庫</Link>
          <Link href="/recognition" className="btn-secondary" data-home-practice>識讀練習</Link>
          <Link href="/ctf" className="btn-secondary" data-home-practice>開始 CTF 挑戰</Link>
        </nav>
        <Link className="homepage-simple-account" href={nav.loggedIn ? "/submissions?mine=1" : "/register"}>
          {nav.loggedIn ? "我的練習紀錄 →" : "註冊帳號 →"}
        </Link>
      </section>

      <section className="homepage-simple-stats" aria-label="公開題庫統計">
        {stats.map((stat) => <div key={stat.label} className="card p-4">
          <p className="page-kicker">{stat.label}</p><p className="mono mt-2 text-2xl font-bold">{stat.value.toLocaleString("zh-TW")}</p>
        </div>)}
      </section>

      {data.daily && <section className="card homepage-simple-notice" data-app-section="daily">
        <div className="min-w-0"><p className="page-kicker">每日一題</p><Link className="mt-1 block truncate font-semibold text-blue hover:underline" href={`/problems/${data.daily.problemCode}`}>{data.daily.problemCode} {data.daily.title}</Link></div>
        <div className="flex shrink-0 items-center gap-3"><DifficultyBadge difficulty={data.daily.difficulty} />{data.dailySolved && <span className="text-xs text-[var(--green)]">已解出 ✓</span>}</div>
      </section>}
      {data.nextAction && <section className="card homepage-simple-notice">
        <div className="min-w-0"><p className="page-kicker">繼續學習</p><Link className="mt-1 block truncate font-semibold text-blue hover:underline" href={data.nextAction.href}>{data.nextAction.title}</Link><p className="mt-1 text-xs text-dim">{data.nextAction.detail}</p></div>
        <Link className="text-sm text-blue hover:underline" href={data.nextAction.href}>繼續 →</Link>
      </section>}
      {data.ctfStats && <section className="card homepage-simple-notice" data-home-personal-ctf>
        <div><p className="page-kicker">我的 CTF</p><p className="mt-1 text-sm text-dim">已解出 {data.ctfStats.solved} / {data.ctfStats.total} 題，已累積 <strong>{data.ctfStats.points}</strong> 分。</p></div>
        <Link className="text-sm text-blue hover:underline" href="/ctf?status=unsolved">繼續挑戰 →</Link>
      </section>}

      {data.announcements.length > 0 && <section data-app-section="announcements">
        <div className="homepage-simple-heading"><h2 className="section-title">公告</h2><Link href="/announcements">全部公告 →</Link></div>
        <div className="card">{data.announcements.map((announcement) => <Link key={announcement.id} href={`/announcements/${announcement.id}`} className="homepage-simple-row">
          {announcement.isPinned && <span className="vbadge vbadge-green">置頂</span>}
          <span className="min-w-0 flex-1 truncate text-blue">{announcement.title}</span>
          <time className="mono shrink-0 text-xs text-mute">{announcement.createdAt.toLocaleDateString("zh-TW", { timeZone: "Asia/Taipei" })}</time>
        </Link>)}</div>
      </section>}

      <section className="homepage-simple-grid" aria-label="最新題目">
        <div>
          <div className="homepage-simple-heading"><h2 className="section-title">最新實作題</h2><Link href="/problems">全部題目 →</Link></div>
          <div className="card">
            {data.latestProblems.length === 0 && <p className="homepage-simple-empty">還沒有公開題目。</p>}
            {data.latestProblems.map((problem) => <div key={problem.id} className="homepage-simple-row">
              <span className="mono text-xs text-mute">{problem.problemCode}</span>
              <Link className="min-w-0 flex-1 truncate text-blue hover:underline" href={`/problems/${problem.problemCode}`}>{problem.title}</Link>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>)}
          </div>
        </div>
        <div>
          <div className="homepage-simple-heading"><h2 className="section-title">最新 CTF</h2><Link href="/ctf">全部挑戰 →</Link></div>
          <div className="card">
            {data.latestCtf.length === 0 && <p className="homepage-simple-empty">尚無公開挑戰。</p>}
            {data.latestCtf.map((challenge) => <div key={challenge.id} className="homepage-simple-row" data-home-ctf-id={challenge.id}>
              <div className="min-w-0 flex-1"><Link className="block truncate text-blue hover:underline" href={`/ctf/${challenge.id}`}>{challenge.title}</Link>
                <p className="mt-1 text-xs text-mute">{challenge.category}{challenge.solves.length > 0 ? " · 已解出 ✓" : ""}</p>
              </div>
              <span className="mono shrink-0 text-xs text-dim">{challenge.points} 分</span>
              {challenge.labType && <a className="text-xs text-blue hover:underline" href={`/ctf/labs/${challenge.id}`} target="_blank" rel="noopener noreferrer" aria-label={`開啟${challenge.title}練習網站`}>Web Lab ↗</a>}
            </div>)}
          </div>
          <Link href="/ctf/scoreboard" className="homepage-simple-more">CTF 計分板 →</Link>
        </div>
      </section>

      <section className="homepage-simple-grid">
        <div>
          <div className="homepage-simple-heading"><h2 className="section-title">全站排行</h2><Link href="/ranking">完整排行 →</Link></div>
          <div className="card">
            {data.ranking.length === 0 && <p className="homepage-simple-empty">還沒有解題成績。</p>}
            {data.ranking.map((user, index) => <div key={user.username} className="homepage-simple-row">
              <span className="mono w-5 shrink-0 text-xs text-mute">{index + 1}</span>
              <Link className="min-w-0 flex-1 truncate hover:underline" href={`/users/${encodeURIComponent(user.username)}`}>{user.displayName || user.username}</Link>
              <span className="mono text-sm text-[var(--green)]">{Number(user.score).toFixed(3)}</span>
            </div>)}
          </div>
          <p className="mt-2 text-xs text-mute">實作／識讀／CTF，依 42／28／30 加權。</p>
        </div>
        {data.feed.items.length > 0 && <div data-app-section="feed">
          <div className="homepage-simple-heading"><h2 className="section-title">{data.feed.title}</h2><Link href={nav.loggedIn ? "/activity" : "/register"}>{nav.loggedIn ? "更多動態 →" : "註冊後追蹤 →"}</Link></div>
          <FeedList items={data.feed.items} />
        </div>}
      </section>

      <section className="homepage-simple-tools" data-app-section="promo" aria-label="下載工具">
        <span className="text-dim">下載工具</span>
        <a href="https://github.com/itousouta15/itouOJ/releases/tag/app-v1.2.0" target="_blank" rel="noopener noreferrer">Android App ↓</a>
        <a href="https://github.com/itousouta15/itouOJ/releases/tag/v1.3.2" target="_blank" rel="noopener noreferrer">Windows 收件程式 ↓</a>
      </section>
      <details className="homepage-simple-environment" data-app-section="env-info"><summary>評測環境</summary><div>
        <div className="mt-3 flex flex-wrap gap-2">{Object.keys(LANGUAGES).map((key) => isLanguageKey(key) && <span key={key} className="mono border border-bd bg-inset px-3 py-1.5 text-xs text-dim">{LANGUAGES[key].label}</span>)}</div>
        <p className="mt-3 text-xs leading-relaxed text-dim">程式提交由隔離沙箱評測，逐筆回報時間與記憶體用量；CTF Flag 由網站即時判定。</p>
      </div></details>
    </div>
  );
}
