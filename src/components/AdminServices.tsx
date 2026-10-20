"use client";

import { useEffect, useState } from "react";
import { MANAGED_SERVICES, type ManagedService, type ServiceAction, type ServiceState } from "@/lib/managedServices";

type Snapshot = { services: ServiceState[]; sampledAt: string };
const labels = { active: "運作中", inactive: "未啟動", failed: "啟動失敗", unknown: "狀態不明" };

export default function AdminServices() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<ManagedService | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      let retry = true;
      try {
        const response = await fetch("/api/admin/services", {
          cache: "no-store", credentials: "same-origin", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
        });
        if (response.status === 403) {
          retry = false;
          if (active) setSnapshot(null);
          throw new Error("管理員登入已失效，請重新登入。");
        }
        if (!response.ok) throw new Error("無法讀取服務狀態，請稍後重試。");
        const data: Snapshot = await response.json();
        if (active) { setSnapshot(data); setError(null); }
      } catch (cause) {
        if (active) setError(cause instanceof Error && cause.name !== "TimeoutError" && cause.name !== "AbortError" ?
          cause.message : "無法讀取服務狀態，請稍後重試。");
      } finally {
        if (active && retry) timer = setTimeout(poll, 5000);
      }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [refresh]);

  async function act(service: ManagedService, action: ServiceAction) {
    setBusy(service); setError(null); setMessage(null);
    try {
      const response = await fetch(`/api/admin/services?service=${service}&action=${action}`, {
        method: "POST", credentials: "same-origin", cache: "no-store",
      });
      if (response.status === 403) { setSnapshot(null); throw new Error("管理員登入已失效，請重新登入。"); }
      if (!response.ok) throw new Error("操作失敗，請檢查伺服器日誌後重試。");
      setMessage(service === "website" ? "網站重啟已排程，連線可能短暫中斷；狀態會自動更新。" :
        `${MANAGED_SERVICES[service].label}：操作已送出。`);
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "操作失敗，請稍後重試。");
    } finally {
      setBusy(null);
    }
  }

  return <section aria-label="主機服務">
    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-dim">
      <button className="btn-secondary" onClick={() => setRefresh((value) => value + 1)}>立即更新</button>
      <span role="status">{snapshot ? `上次更新：${new Date(snapshot.sampledAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}（台北時間）` : "讀取服務狀態中…"}</span>
    </div>
    {error && <p role="alert" className="card mb-4 p-4 text-sm text-red">{error}</p>}
    {message && <p role="status" className="card mb-4 p-4 text-sm text-dim">{message}</p>}
    <div className="grid gap-3 md:grid-cols-3">
      {snapshot?.services.map(({ service, state, enabled }) => {
        const canStart = service !== "website" && (state === "inactive" || state === "failed" || (service === "worker" && !enabled));
        return <div key={service} className="card p-4">
          <h2 className="font-semibold">{MANAGED_SERVICES[service].label}</h2>
          <p className="my-3 text-sm">狀態：<span className={`vbadge ${state === "active" ? "vbadge-green" : "vbadge-amber"}`}>{labels[state]}</span></p>
          {service === "worker" && <p className="mb-3 text-sm text-dim">開機自動啟動：{enabled ? "已啟用" : "未啟用"}</p>}
          <div className="flex flex-wrap gap-2">
            {canStart && <button className="btn-secondary" disabled={busy !== null} onClick={() => void act(service, "start")}>
              {service === "worker" && state === "active" ? "啟用自動啟動" : "啟動"}
            </button>}
            <button className="btn-secondary" disabled={busy !== null || state === "unknown"} onClick={() => void act(service, "restart")}>重新啟動</button>
          </div>
        </div>;
      })}
    </div>
    <p className="mt-4 text-sm text-mute">此頁管理目前網站主機上的 systemd 服務；網站完全停止時，需從主機端恢復。</p>
  </section>;
}
