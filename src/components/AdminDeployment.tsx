"use client";

import { useEffect, useState } from "react";

type Snapshot = { deployed: string | null; latest: string | null;
  triggerMode: "instant" | "scheduled";
  job: { state: string; phase?: string; target?: string | null; startedAt?: string; updatedAt?: string;
    message?: string | null; runId?: string }; logs: string;
  previous?: { state: string; target?: string | null; runId?: string } | null; previousLogs?: string };
const phaseNames: Record<string, string> = {
  queued: "等待 GitHub Actions", claimed: "已領取工作", packaging: "打包中",
  uploading: "上傳中", verifying: "正式站建置與驗證中", done: "完成",
};
const resultNames: Record<string, string> = {
  queued: "等待中", running: "進行中", succeeded: "成功", failed: "失敗",
  cancelled: "已取消", interrupted: "已中斷", current: "已是最新",
};

export default function AdminDeployment() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      let retry = true;
      try {
        const response = await fetch("/api/admin/deployment", { credentials: "same-origin", cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]) });
        if (response.status === 403) { retry = false; if (active) setSnapshot(null); throw new Error("管理員登入已失效，請重新登入。"); }
        if (!response.ok) throw new Error("無法讀取部署狀態，請稍後重試。");
        const data: Snapshot = await response.json();
        if (active) { setSnapshot(data); setError(null); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "無法讀取部署狀態。"); }
      finally { if (active && retry) timer = setTimeout(poll, 5000); }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [refresh]);

  async function start() {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/deployment", { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 403 ? "管理員登入已失效，請重新登入。" : "部署無法開始，請查看伺服器日誌。");
      const result = await response.json();
      setSnapshot((current) => current ? { ...current, job: { state: "queued" } } : current);
      setMessage(result.triggerMode === "instant" ? "已要求 GitHub Actions 立即啟動。" : "已排入工作，等待 GitHub 排程接手。");
      setRefresh((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "部署無法開始。"); }
    finally { setBusy(false); }
  }

  const updating = snapshot?.job.state === "queued" || snapshot?.job.state === "running";
  const newer = !!snapshot?.deployed && !!snapshot?.latest && snapshot.deployed !== snapshot.latest;
  return <section aria-label="GitHub 部署">
    <p className="mb-4 text-sm text-dim">比較正式站與 GitHub master 的已推送版本。按下按鈕後會排入該提交，GitHub Actions 負責建置與測試，通過後才切換網站。</p>
    {snapshot && <p className="mb-4 text-sm text-dim">{snapshot.triggerMode === "instant" ? "即時觸發已設定：按下部署後會立即請 GitHub Actions 啟動。" :
      "目前使用排程接手；若要按下後立即啟動，需設定專用 GitHub Actions 權杖。"}</p>}
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card p-4"><p className="text-sm text-mute">正式站版本</p><p className="mono mt-2 break-all">{snapshot?.deployed ?? "尚無版本紀錄"}</p></div>
      <div className="card p-4"><p className="text-sm text-mute">GitHub master</p><p className="mono mt-2 break-all">{snapshot?.latest ?? "暫時無法查詢"}</p></div>
    </div>
    <div className="card mt-4 p-4">
      <p className="font-semibold">{updating ? "部署進行中" : snapshot?.job.state === "cancelled" ? "過期的部署請求已取消" :
        snapshot?.job.state === "failed" || snapshot?.job.state === "interrupted" ? "部署失敗，可查看紀錄後重試" :
        !snapshot?.latest ? "GitHub 狀態無法取得" : !snapshot.deployed ? "尚未建立正式站版本紀錄" : newer ? "有新版本可部署" : "已是最新版本"}</p>
      {snapshot?.job.phase && <p className="mt-2 text-sm text-dim">階段：{phaseNames[snapshot.job.phase] ?? snapshot.job.phase}</p>}
      {snapshot?.job.runId && <a className="mt-2 inline-block text-sm text-blue hover:underline"
        href={`https://github.com/itousouta15/itouOJ/actions/runs/${snapshot.job.runId}`} target="_blank" rel="noopener noreferrer">
        查看 GitHub Actions 打包與部署紀錄 →
      </a>}
      {snapshot?.job.message && <p className="mt-2 text-sm text-red" role="alert">{snapshot.job.message}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => setRefresh((value) => value + 1)}>立即更新</button>
        <button className="btn-secondary" disabled={!newer || updating || busy} onClick={() => void start()}>
          {updating ? "部署中…" : "一鍵部署 GitHub master"}
        </button>
      </div>
    </div>
    <div className="card mt-4 p-4">
      <h2 className="mb-3 font-semibold">正式站部署紀錄（最近 32 KB）</h2>
      <pre className="mono max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs text-dim"
        aria-label="部署執行紀錄">{snapshot?.logs || "目前沒有部署紀錄；GitHub 建置階段請看 Actions 紀錄。"}</pre>
    </div>
    {snapshot?.previous && <div className="card mt-4 p-4">
      <h2 className="mb-2 font-semibold">前一次部署紀錄</h2>
      <p className="mb-2 text-sm text-dim">{resultNames[snapshot.previous.state] ?? snapshot.previous.state}：<span className="mono">{snapshot.previous.target ?? "—"}</span></p>
      {snapshot.previous.runId && <a className="mb-3 inline-block text-sm text-blue hover:underline"
        href={`https://github.com/itousouta15/itouOJ/actions/runs/${snapshot.previous.runId}`} target="_blank" rel="noopener noreferrer">
        查看前一次 GitHub Actions 紀錄 →
      </a>}
      <pre className="mono max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-dim"
        aria-label="前一次部署執行紀錄">{snapshot.previousLogs || "沒有保存正式站輸出。"}</pre>
    </div>}
    {error && <p className="card mt-4 p-4 text-sm text-red" role="alert">{error}</p>}
    {message && <p className="card mt-4 p-4 text-sm text-dim" role="status">{message}</p>}
  </section>;
}
