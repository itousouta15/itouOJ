"use client";

import { useEffect, useRef, useState } from "react";
import type { LanguageKey } from "@/lib/languages";

type TerminalEvent =
  | { type: "state"; state: "compiling" | "running" }
  | { type: "output"; text: string }
  | { type: "error"; message: string }
  | { type: "exit"; code: number | null; reason: string };
type Status = "starting" | "compiling" | "running" | "stopping" | "done";
const STATUS_LABELS: Record<Status, string> = {
  starting: "連線中…", compiling: "編譯中…", running: "執行中", stopping: "停止中…", done: "已結束",
};

async function stopSession(id: string) {
  await fetch(`/api/terminal/${id}`, { method: "DELETE", keepalive: true });
}

export default function InteractiveTerminal({
  problemId, contestId, language, code, onBusyChange, onClose,
}: {
  problemId: number;
  contestId?: number;
  language: LanguageKey;
  code: string;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
}) {
  // A RUN uses a snapshot; editing the source during execution doesn't restart it.
  const [source] = useState({ problemId, contestId, language, code });
  const [status, setStatus] = useState<Status>("starting");
  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [eof, setEof] = useState(false);
  const [closing, setClosing] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = status !== "done";
  const lastBreak = output.lastIndexOf("\n") + 1;
  const history = output.slice(0, lastBreak);
  const currentLine = output.slice(lastBreak);

  function append(text: string) {
    setOutput((previous) => (previous + text).slice(-300_000));
  }

  useEffect(() => {
    let disposed = false;
    let id: string | null = null;
    const polling = new AbortController();
    onBusyChange(true);
    async function start() {
      try {
        const response = await fetch("/api/terminal", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(source),
        });
        const created = await response.json();
        if (!response.ok) throw new Error(created.error ?? "無法啟動程式");
        id = created.id as string;
        if (disposed) {
          await stopSession(id);
          return;
        }
        sessionRef.current = id;
        let cursor = 0;
        for (;;) {
          const result = await fetch(`/api/terminal/${id}?cursor=${cursor}`, {
            cache: "no-store", signal: polling.signal,
          });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error ?? "終端機連線中斷");
          if (disposed) return;
          for (const event of data.events as TerminalEvent[]) {
            if (event.type === "output") append(event.text);
            if (event.type === "state") setStatus(event.state);
            if (event.type === "error") append(`\n${event.message}\n`);
            if (event.type === "exit") {
              const reason = event.reason === "stopped" ? "已停止"
                : event.reason === "compile-error" ? "編譯失敗"
                : event.reason === "timeout" ? "超過執行時間限制"
                : `程式已結束（exit code: ${event.code ?? "—"}）`;
              append(`\n${reason}\n`);
            }
          }
          cursor = data.cursor;
          if (data.done) break;
          // Avoid a hot request loop for programs continuously producing output.
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (error) {
        if (!disposed) {
          append(`\n${error instanceof Error ? error.message : "終端機連線中斷"}\n`);
          if (id) void stopSession(id).catch(() => {});
        }
      } finally {
        if (!disposed) {
          setStatus("done");
          onBusyChange(false);
        }
      }
    }
    // React Strict Mode runs setup/cleanup once before the real mount. Defer the
    // POST so that probe doesn't create a second server-side session.
    const startTimer = setTimeout(() => void start(), 0);
    const stopOnLeave = () => { if (id) void stopSession(id).catch(() => {}); };
    window.addEventListener("pagehide", stopOnLeave);
    return () => {
      disposed = true;
      clearTimeout(startTimer);
      polling.abort();
      stopOnLeave();
      window.removeEventListener("pagehide", stopOnLeave);
      onBusyChange(false);
    };
  }, [source, onBusyChange]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output, input]);
  useEffect(() => {
    if (status === "running") inputRef.current?.focus();
  }, [status]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
  }, []);

  function closeTerminal() {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
    closeTimerRef.current = setTimeout(onClose, 180);
  }

  async function sendInput(end = false) {
    const id = sessionRef.current;
    if (!id || status !== "running" || eof || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const text = end ? (input ? `${input}\n` : "") : `${input}\n`;
    append(text);
    try {
      const response = await fetch(`/api/terminal/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, eof: end }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "輸入傳送失敗");
      setInput("");
      if (end) setEof(true);
    } catch (error) {
      append(`\n${error instanceof Error ? error.message : "輸入傳送失敗"}\n`);
    } finally {
      sendingRef.current = false;
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function stop() {
    const id = sessionRef.current;
    if (!id || !busy) return;
    setStatus("stopping");
    try {
      const response = await fetch(`/api/terminal/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("停止失敗，可再按一次停止");
    } catch (error) {
      append(`\n${error instanceof Error ? error.message : "停止失敗"}\n`);
    }
  }

  return (
    <section
      className={`interactive-terminal${closing ? " interactive-terminal--closing" : ""}`}
      data-status={status}
      aria-label="互動式終端機"
    >
      <div className="interactive-terminal-head">
        <strong>Terminal</strong>
        <span role="status">{STATUS_LABELS[status]}</span>
        <div className="interactive-terminal-controls">
          <button type="button" title="結束標準輸入（Ctrl+D）" disabled={status !== "running" || eof || sending} onClick={() => void sendInput(true)}>EOF</button>
          <button type="button" onClick={() => void stop()} disabled={!busy || !sessionRef.current}>停止</button>
          <button type="button" onClick={closeTerminal} aria-label="關閉終端機">✕</button>
        </div>
      </div>
      <div
        ref={outputRef}
        className="interactive-terminal-screen"
        role="log"
        aria-label="程式輸出"
        aria-live="off"
        tabIndex={0}
        onClick={() => {
          if (status === "running" && !eof && !window.getSelection()?.toString()) inputRef.current?.focus();
        }}
      >
        <pre className="interactive-terminal-history">{output ? history : status === "starting" || status === "compiling" ? "正在啟動程式…\n" : ""}</pre>
        <div className="interactive-terminal-line">
          {currentLine && <span className="interactive-terminal-current">{currentLine}</span>}
          {status === "running" && !eof && (
            <form className="interactive-terminal-entry" onSubmit={(event) => { event.preventDefault(); void sendInput(); }}>
              {!currentLine && <span aria-hidden="true">›</span>}
              <textarea
                ref={inputRef}
                rows={1}
                aria-label="終端機輸入"
                value={input}
                disabled={sending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault(); void sendInput();
                  } else if (event.ctrlKey && event.key.toLowerCase() === "d") {
                    event.preventDefault(); void sendInput(true);
                  } else if (event.ctrlKey && event.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
                    event.preventDefault(); void stop();
                  }
                }}
              />
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
