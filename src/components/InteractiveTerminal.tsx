"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

function InteractiveTerminal({
  problemId, contestId, language, code, mobile = false, onBusyChange, onClose,
}: {
  problemId: number;
  contestId?: number;
  language: LanguageKey;
  code: string;
  mobile?: boolean;
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
  const [sessionReady, setSessionReady] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followOutputRef = useRef(true);
  const scrollFrameRef = useRef<number | null>(null);
  const busy = status !== "done";
  const { history, currentLine } = useMemo(() => {
    const lastBreak = output.lastIndexOf("\n") + 1;
    return { history: output.slice(0, lastBreak), currentLine: output.slice(lastBreak) };
  }, [output]);

  function append(text: string) {
    setOutput((previous) => (previous + text).slice(-300_000));
  }

  useEffect(() => {
    let disposed = false;
    let id: string | null = null;
    let waitTimer: ReturnType<typeof setTimeout> | undefined;
    let resumeWait: (() => void) | undefined;
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
        setSessionReady(true);
        let cursor = 0;
        while (!disposed) {
          const result = await fetch(`/api/terminal/${id}?cursor=${cursor}`, {
            cache: "no-store", signal: polling.signal,
          });
          const data = await result.json();
          if (!result.ok) throw new Error(data.error ?? "終端機連線中斷");
          if (disposed) return;
          const text: string[] = [];
          let nextStatus: Status | undefined;
          for (const event of data.events as TerminalEvent[]) {
            if (event.type === "output") text.push(event.text);
            if (event.type === "state") nextStatus = event.state;
            if (event.type === "error") text.push(`\n${event.message}\n`);
            if (event.type === "exit") {
              const reason = event.reason === "stopped" ? "已停止"
                : event.reason === "compile-error" ? "編譯失敗"
                : event.reason === "timeout" ? "超過執行時間限制"
                : `程式已結束（exit code: ${event.code ?? "—"}）`;
              text.push(`\n${reason}\n`);
            }
          }
          // 一批事件只合併、裁切整份輸出一次，避免高頻小輸出反覆複製字串。
          if (text.length) append(text.join(""));
          if (nextStatus) setStatus(nextStatus);
          cursor = data.cursor;
          if (data.done) break;
          // Avoid a hot request loop for programs continuously producing output.
          await new Promise<void>((resolve) => {
            resumeWait = resolve;
            waitTimer = setTimeout(() => {
              waitTimer = undefined;
              resumeWait = undefined;
              resolve();
            }, 200);
          });
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
      clearTimeout(waitTimer);
      resumeWait?.();
      polling.abort();
      stopOnLeave();
      window.removeEventListener("pagehide", stopOnLeave);
      onBusyChange(false);
    };
  }, [source, onBusyChange]);

  const followOutput = useCallback(() => {
    if (document.hidden || !followOutputRef.current) return;
    if (scrollFrameRef.current !== null) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      const screen = outputRef.current;
      if (screen && followOutputRef.current) screen.scrollTop = screen.scrollHeight;
    });
  }, []);

  useEffect(() => { followOutput(); }, [output, input, status, followOutput]);

  useEffect(() => {
    const frame = scrollFrameRef;
    document.addEventListener("visibilitychange", followOutput);
    return () => {
      document.removeEventListener("visibilitychange", followOutput);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [followOutput]);
  useEffect(() => {
    if (status === "running") inputRef.current?.focus();
  }, [status]);

  useEffect(() => () => {
    if (closeTimerRef.current !== null) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const previousFocus = document.activeElement;
    const viewport = window.visualViewport;
    let resizeFrame: number | undefined;
    const resize = () => {
      if (!modalRef.current || !viewport) return;
      modalRef.current.style.height = `${viewport.height}px`;
      modalRef.current.style.top = `${viewport.offsetTop}px`;
    };
    resize();
    const queueResize = () => {
      if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { resizeFrame = undefined; resize(); });
    };
    const frame = requestAnimationFrame(() => {
      if (!modalRef.current?.contains(document.activeElement)) modalRef.current?.focus();
    });
    viewport?.addEventListener("resize", queueResize);
    viewport?.addEventListener("scroll", queueResize);
    return () => {
      cancelAnimationFrame(frame);
      if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
      viewport?.removeEventListener("resize", queueResize);
      viewport?.removeEventListener("scroll", queueResize);
      requestAnimationFrame(() => {
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected && !previousFocus.closest("[inert]")) {
          previousFocus.focus();
        }
      });
    };
  }, [mobile]);

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

  const terminal = (
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
          <button type="button" onClick={() => void stop()} disabled={!busy || !sessionReady}>停止</button>
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
        onScroll={(event) => {
          const screen = event.currentTarget;
          followOutputRef.current = screen.scrollHeight - screen.scrollTop - screen.clientHeight <= 32;
        }}
        onClick={() => {
          if (followOutputRef.current && status === "running" && !eof && !window.getSelection()?.toString()) inputRef.current?.focus();
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
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
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
              {mobile && (
                <button type="submit" disabled={sending} onMouseDown={(event) => event.preventDefault()}>
                  {sending ? "傳送中…" : "送出"}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );

  if (!mobile) return terminal;

  return createPortal(
    <div
      ref={modalRef}
      className="mobile-terminal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Terminal 互動執行"
      tabIndex={-1}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      onTouchCancel={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          closeTerminal();
        } else if (event.key === "Tab") {
          const controls = event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      {terminal}
    </div>,
    document.body
  );
}

export default memo(InteractiveTerminal);
