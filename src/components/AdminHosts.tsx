"use client";

import { useEffect, useState } from "react";

type Command = { id: number; service: string; action: string; state: string; createdAt: string };
type Host = { id: string; name: string; address: string; role: string; enabled: boolean; online: boolean;
  lastSeenAt: string | null; workerState: string | null; sandboxState: string | null; commands: Command[] };
type Snapshot = { hosts: Host[]; sampledAt: string };

export default function AdminHosts() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState<"PRIMARY" | "BACKUP">("BACKUP");
  const [pairing, setPairing] = useState<{ name: string; token: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<Record<string, { address: string; role: "PRIMARY" | "BACKUP" }>>({});
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch("/api/admin/hosts", { cache: "no-store", credentials: "same-origin",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]) });
        if (response.status === 403) { if (active) setSnapshot(null); throw new Error("管理員權限已失效，請重新登入。"); }
        if (!response.ok) throw new Error("無法讀取主機狀態。");
        const data: Snapshot = await response.json();
        if (active) { setSnapshot(data); setError(null); }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "無法讀取主機狀態。");
      } finally { if (active) timer = setTimeout(poll, 5000); }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [refresh]);

  async function send(body: object) {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/admin/hosts", { method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (response.status === 403) { setSnapshot(null); throw new Error("管理員權限已失效，請重新登入。"); }
      if (!response.ok) throw new Error(result.error ?? "操作失敗，請稍後重試。");
      if ("token" in result) {
        const currentName = "host" in result ? result.host.name : snapshot?.hosts.find((host) => host.id === (body as { id?: string }).id)?.name ?? "Server";
        setPairing({ name: currentName, token: result.token }); setName(""); setAddress("");
      } else setMessage("操作已送出；主機狀態將自動更新。");
      setRefresh((value) => value + 1);
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失敗。"); return false; }
    finally { setBusy(false); }
  }

  return <section aria-label="遠端主機">
    <p className="mb-4 text-sm text-dim">每台主機以接入憑證主動連線，無需在後台保存 SSH 密碼。主要與備援 worker 共用評測佇列；主機離線後，其他 worker 會繼續領取工作，逾期租約也會自動回收。重發憑證會立即讓舊 worker 失去存取權，需同步更新主機設定。</p>
    <div className="card mb-5 p-4">
      <h2 className="mb-3 font-semibold">新增 Server</h2>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void send({ action: "create", name, address, role }); }}>
        <label className="text-sm">主機名稱<input className="input mt-1 block" required maxLength={64} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-sm">主機位址（只作標示）<input className="input mt-1 block" required maxLength={255} value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <label className="text-sm">角色<select className="input mt-1 block" value={role} onChange={(event) => setRole(event.target.value as "PRIMARY" | "BACKUP")}>
          <option value="PRIMARY">主要</option><option value="BACKUP">備援</option>
        </select></label>
        <button className="btn-secondary" disabled={busy}>新增並產生憑證</button>
      </form>
    </div>
    {pairing && <div className="card mb-4 p-4 text-sm" role="status">
      <p className="mb-2 font-semibold">{pairing.name} 的接入憑證（只顯示這一次）</p>
      <code className="block break-all select-all">{pairing.token}</code>
      <p className="mt-2 text-dim">在該主機的 `/etc/online-judge/remote-managed.env` 設定 JUDGE_WORKER_URL={typeof window !== "undefined" ? window.location.origin : "https://your-oj-host"} 與 JUDGE_WORKER_SECRET=上方憑證，並安裝主機 agent、評測 worker 及 sandbox。</p>
      <button className="btn-secondary mt-2" onClick={() => setPairing(null)}>已儲存憑證</button>
    </div>}
    {error && <p className="card mb-4 p-4 text-sm text-red" role="alert">{error}</p>}
    {message && <p className="card mb-4 p-4 text-sm text-dim" role="status">{message}</p>}
    <div className="mb-3 flex items-center gap-3 text-sm text-dim">
      <button className="btn-secondary" onClick={() => setRefresh((value) => value + 1)}>立即更新</button>
      <span>{snapshot ? `顯示 ${snapshot.hosts.length} 台主機` : "載入主機中…"}</span>
    </div>
    {snapshot?.hosts.length === 0 && <p className="card p-4 text-sm text-mute">目前沒有已設定的遠端 Server。</p>}
    <div className="grid gap-3 md:grid-cols-2">
      {snapshot?.hosts.map((host) => <div key={host.id} className="card p-4 text-sm">
        <h2 className="font-semibold">{host.name} <span className="text-dim">({host.role === "BACKUP" ? "備援" : "主要"})</span></h2>
        <p className="mt-1 text-dim">{host.address}</p>
        <p className="mt-2">{!host.enabled ? "已停用" : host.online ? "已連線" : "離線"}；最近回報：{host.lastSeenAt ? new Date(host.lastSeenAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }) : "尚未連線"}</p>
        <p className="mt-1">評測 worker：{host.workerState ?? "—"}；sandbox：{host.sandboxState ?? "—"}</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label>主機位址<input className="input mt-1 block" maxLength={255} value={edits[host.id]?.address ?? host.address}
            onChange={(event) => setEdits((current) => ({ ...current, [host.id]: { address: event.target.value, role: current[host.id]?.role ?? host.role as "PRIMARY" | "BACKUP" } }))} /></label>
          <label>角色<select className="input mt-1 block" value={edits[host.id]?.role ?? host.role}
            onChange={(event) => setEdits((current) => ({ ...current, [host.id]: { address: current[host.id]?.address ?? host.address, role: event.target.value as "PRIMARY" | "BACKUP" } }))}>
            <option value="PRIMARY">主要</option><option value="BACKUP">備援</option>
          </select></label>
          <button className="btn-secondary" disabled={busy || !edits[host.id]?.address.trim()} onClick={() => {
            void send({ action: "updateDetails", id: host.id, ...edits[host.id] }).then((ok) => {
              if (ok) setEdits((current) => { const updated = { ...current }; delete updated[host.id]; return updated; });
            });
          }}>儲存設定</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-secondary" disabled={busy} onClick={() => void send({ action: "setEnabled", id: host.id, enabled: !host.enabled })}>{host.enabled ? "停用主機" : "啟用主機"}</button>
          <button className="btn-secondary" disabled={busy} onClick={() => void send({ action: "rotate", id: host.id })}>重發接入憑證</button>
          {host.enabled && (["remote", "sandbox"] as const).map((service) => (["start", "restart"] as const).map((operation) =>
            <button key={`${service}:${operation}`} className="btn-secondary" disabled={busy} onClick={() => void send({ action: "command", id: host.id, service, operation })}>
              {service === "remote" ? "Worker" : "Sandbox"} {operation === "start" ? "啟動" : "重啟"}
            </button>))}
        </div>
        {host.commands[0] && <p className="mt-3 text-dim">上次操作：{host.commands[0].service} {host.commands[0].action}（{host.commands[0].state}）</p>}
      </div>)}
    </div>
  </section>;
}
