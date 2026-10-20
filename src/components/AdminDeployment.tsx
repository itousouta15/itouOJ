"use client";

import { useEffect, useState } from "react";

type Snapshot = { deployed: string | null; latest: string | null;
  job: { state: string; phase?: string; target?: string | null; startedAt?: string; updatedAt?: string; message?: string | null } };

export default function AdminDeployment() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
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
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/deployment", { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 403 ? "管理員登入已失效，請重新登入。" : "部署無法開始，請查看伺服器日誌。");
      setSnapshot((current) => current ? { ...current, job: { state: "queued" } } : current);
      setRefresh((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "部署無法開始。"); }
    finally { setBusy(false); }
  }

  const updating = snapshot?.job.state === "queued" || snapshot?.job.state === "running";
  const newer = !!snapshot?.deployed && !!snapshot?.latest && snapshot.deployed !== snapshot.latest;
  return <section aria-label="GitHub 部署">
    <p className="mb-4 text-sm text-dim">比較正式站與 GitHub master 的已推送版本。按下按鈕後會排入該提交，GitHub Actions 通常在 5 分鐘內接手，建置與測試通過後才切換網站。</p>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card p-4"><p className="text-sm text-mute">正式站版本</p><p className="mono mt-2 break-all">{snapshot?.deployed ?? "尚無版本紀錄"}</p></div>
      <div className="card p-4"><p className="text-sm text-mute">GitHub master</p><p className="mono mt-2 break-all">{snapshot?.latest ?? "暫時無法查詢"}</p></div>
    </div>
    <div className="card mt-4 p-4">
      <p className="font-semibold">{updating ? "部署進行中" : !snapshot?.latest ? "GitHub 狀態無法取得" : !snapshot.deployed ? "尚未建立正式站版本紀錄" : newer ? "有新版本可部署" : "已是最新版本"}</p>
      {snapshot?.job.phase && <p className="mt-2 text-sm text-dim">階段：{snapshot.job.phase}（{snapshot.job.state}）</p>}
      {snapshot?.job.message && <p className="mt-2 text-sm text-red" role="alert">{snapshot.job.message}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => setRefresh((value) => value + 1)}>立即更新</button>
        <button className="btn-secondary" disabled={!newer || updating || busy} onClick={() => void start()}>
          {updating ? "部署中…" : "一鍵部署 GitHub master"}
        </button>
      </div>
    </div>
    {error && <p className="card mt-4 p-4 text-sm text-red" role="alert">{error}</p>}
  </section>;
}
