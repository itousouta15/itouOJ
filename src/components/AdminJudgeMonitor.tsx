"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { JudgeMonitorSnapshot } from "@/lib/judgeMonitor";

const duration = (ms: number | null) => {
  if (ms === null) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分 ${seconds % 60} 秒`;
  return `${Math.floor(seconds / 3600)} 小時 ${Math.floor(seconds % 3600 / 60)} 分`;
};
const timestamp = (value: string | null) => value ? new Date(value).toLocaleString("zh-TW", {
  timeZone: "Asia/Taipei", hour12: false,
}) : "—";

export default function AdminJudgeMonitor() {
  const [snapshot, setSnapshot] = useState<JudgeMonitorSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [automatic, setAutomatic] = useState(true);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    async function poll() {
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 10_000);
      let retry = true;
      setLoading(true);
      try {
        const response = await fetch("/api/admin/judge", {
          credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (response.status === 403) {
          retry = false;
          if (active) setSnapshot(null);
          throw new Error("管理員登入已失效或權限已變更，請重新登入後再試。");
        }
        if (!response.ok) throw new Error("暫時無法讀取評測佇列，請稍後重試。");
        const data: JudgeMonitorSnapshot = await response.json();
        if (active) { setSnapshot(data); setError(null); }
      } catch (cause) {
        if (active) setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "讀取逾時，請重試。");
      } finally {
        clearTimeout(timeout);
        if (active) {
          setLoading(false);
          // Serialized polling: a slow request never overlaps another refresh.
          if (automatic && retry) timer = setTimeout(poll, 5000);
        }
      }
    }
    timer = setTimeout(poll, 0);
    return () => { active = false; clearTimeout(timer); controller?.abort(); };
  }, [automatic, refresh]);

  return <section aria-label="評測佇列" aria-busy={loading}>
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <button className="btn-secondary" disabled={loading} onClick={() => setRefresh((value) => value + 1)}>
        {loading ? "讀取中…" : "立即更新"}
      </button>
      <label className="flex items-center gap-2 text-sm text-dim">
        <input type="checkbox" checked={automatic} onChange={(event) => setAutomatic(event.target.checked)} />
        每 5 秒自動更新
      </label>
      <span className="text-xs text-mute" role="status" aria-live="polite">
        {snapshot ? `上次成功更新：${timestamp(snapshot.sampledAt)}（台北時間）` : loading ? "正在載入佇列狀態…" : "尚無佇列資料"}
      </span>
    </div>
    {error && <p role="alert" className="card mb-4 p-4 text-sm text-red">
      {error}{snapshot && " 下方保留上次成功取得的快照，並非最新狀態。"}
    </p>}
    {snapshot && <>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["等待評測", String(snapshot.pending)], ["評測中", String(snapshot.judging)],
          ["逾期／未租用", String(snapshot.expired)], ["最久等待時間", duration(snapshot.oldestPendingAgeMs)],
        ].map(([label, value]) => <div key={label} className="card p-4">
          <p className="mb-2 text-sm text-mute">{label}</p><p className="mono text-xl font-semibold">{value}</p>
        </div>)}
      </div>
      <p className="mb-3 text-sm text-dim">
        租約 {duration(snapshot.leaseMs)}，心跳間隔 {duration(snapshot.heartbeatMs)}。
        {snapshot.expired > 0 && " 有工作等待回收；下一次執行器領取工作時會自動回收。"}
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <caption className="p-3 text-left text-sm text-mute">
            評測中的租約：顯示 {snapshot.active.length} 筆，最多 {snapshot.activeLimit} 筆（依提交編號）。
            {snapshot.activeTruncated && " 目前清單未涵蓋全部評測工作。"}
          </caption>
          <thead><tr>
            {["提交", "狀態", "最後心跳（台北時間）", "距心跳時間", "租約到期（台北時間）"].map((label) =>
              <th key={label} className="table-head whitespace-nowrap">{label}</th>)}
          </tr></thead>
          <tbody>{snapshot.active.length === 0 ? <tr><td colSpan={5} className="table-cell text-mute">目前沒有評測中的工作。</td></tr> :
            snapshot.active.map((lease) => <tr key={lease.submissionId}>
              <td className="table-cell mono"><Link className="text-blue hover:underline" href={`/submissions/${lease.submissionId}`}>#{lease.submissionId}</Link></td>
              <td className="table-cell"><span className={`vbadge ${lease.state === "live" ? "vbadge-green" : "vbadge-amber"}`}>
                {lease.state === "live" ? "租約有效" : lease.state === "expired" ? "租約逾期" : "缺少租約"}
              </span></td>
              <td className="table-cell whitespace-nowrap">{timestamp(lease.heartbeatAt)}</td>
              <td className="table-cell whitespace-nowrap">{duration(lease.heartbeatAgeMs)}</td>
              <td className="table-cell whitespace-nowrap">{timestamp(lease.leaseExpiresAt)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-mute">
        數量為資料庫即時查詢的近似快照，租約狀態以伺服器取樣時間判定。
        本頁顯示工作租約，不代表執行器主機的在線清單。
      </p>
    </>}
  </section>;
}
