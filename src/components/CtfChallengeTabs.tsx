"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Tab = "challenge" | "attempts" | "solves";
type ActivityRow = { id: number; date: string; result?: string; username?: string; displayName?: string | null };
type Activity = { rows: ActivityRow[]; page: number; hasNext: boolean };

export default function CtfChallengeTabs({ challengeId, solveCount, loggedIn, children }: {
  challengeId: number; solveCount: number; loggedIn: boolean; children: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("challenge");
  const [page, setPage] = useState(1);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tabs: { key: Tab; label: string }[] = [
    { key: "challenge", label: "題目" },
    ...(loggedIn ? [{ key: "attempts" as const, label: "我的提交" }] : []),
    { key: "solves", label: `解題者（${solveCount}）` },
  ];

  useEffect(() => {
    if (tab === "challenge") return;
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true); setError(""); setActivity(null);
      try {
        const response = await fetch(`/api/ctf/challenges/${challengeId}/activity?kind=${tab}&page=${page}`, { signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error ?? "無法載入紀錄");
        if (active) setActivity(data);
      } catch (err) {
        if (active && !controller.signal.aborted) setError(err instanceof Error && !(err instanceof TypeError) ? err.message : "連線失敗，請重試");
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [challengeId, page, retry, tab, solveCount]);

  function select(next: Tab) { setTab(next); setPage(1); setActivity(null); setError(""); }
  return (
    <div className="ctf-challenge-tabs">
      <div role="tablist" aria-label="題目資訊" className="ctf-tab-list">
        {tabs.map((item, index) => (
          <button key={item.key} type="button" role="tab" id={`ctf-${challengeId}-tab-${item.key}`}
            aria-controls={`ctf-${challengeId}-panel-${item.key}`} aria-selected={tab === item.key}
            tabIndex={tab === item.key ? 0 : -1} className={`ctf-tab${tab === item.key ? " active" : ""}`}
            ref={(node) => { buttons.current[index] = node; }} onClick={() => select(item.key)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault(); select(tabs[next].key); buttons.current[next]?.focus();
            }}>
            {item.label}
          </button>
        ))}
      </div>
      <div id={`ctf-${challengeId}-panel-challenge`} role="tabpanel" aria-labelledby={`ctf-${challengeId}-tab-challenge`} hidden={tab !== "challenge"}>
        {children}
      </div>
      {tab !== "challenge" && (
        <div key={tab} id={`ctf-${challengeId}-panel-${tab}`} role="tabpanel" aria-labelledby={`ctf-${challengeId}-tab-${tab}`} className="ctf-activity-panel" aria-busy={loading}>
          {loading && <p role="status" className="py-8 text-center text-dim">載入紀錄中…</p>}
          {error && <div className="space-y-3 py-8"><p role="alert" className="text-[#ff6b6b]">{error}</p><button className="btn-secondary" onClick={() => setRetry((value) => value + 1)}>重新載入</button></div>}
          {activity && <>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr><th className="table-head">{tab === "solves" ? "解題者" : "判定"}</th><th className="table-head">{tab === "solves" ? "首次解出" : "提交時間"}</th></tr></thead>
              <tbody>
                {!activity.rows.length && <tr><td colSpan={2} className="table-cell py-10 text-center text-mute">{tab === "solves" ? "尚未有人解出這題" : "你還沒有提交這題"}</td></tr>}
                {activity.rows.map((row) => <tr key={row.id}>
                  <td className="table-cell">{tab === "solves"
                    ? <Link className="text-blue hover:underline" href={`/users/${encodeURIComponent(row.username!)}`}>{row.displayName || row.username}</Link>
                    : <span className={row.result === "CORRECT" ? "text-[var(--green)]" : "text-dim"}>{row.result === "CORRECT" ? "正確" : "錯誤"}</span>}</td>
                  <td className="table-cell whitespace-nowrap text-dim">{new Date(row.date).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}</td>
                </tr>)}
              </tbody>
            </table></div>
            <nav aria-label="紀錄分頁" className="mt-4 flex items-center justify-center gap-4 text-sm">
              {page > 1 && <button className="btn-secondary" onClick={() => setPage((value) => value - 1)}>上一頁</button>}
              <span>第 {page} 頁</span>
              {activity.hasNext && <button className="btn-secondary" onClick={() => setPage((value) => value + 1)}>下一頁</button>}
            </nav>
          </>}
        </div>
      )}
    </div>
  );
}
