"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { EditorView } from "@codemirror/view";
import { LANGUAGES, LANGUAGE_KEYS, type LanguageKey } from "@/lib/languages";
import { playgroundLimits, PLAYGROUND_TEMPLATES } from "@/lib/playground";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-dim" role="status">載入編輯器中…</p>,
});
const InteractiveTerminal = dynamic(() => import("@/components/InteractiveTerminal"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-dim" role="status">載入終端機中…</p>,
});

interface Draft {
  language: LanguageKey;
  codes: Record<LanguageKey, string>;
}

function initialDraft(): Draft {
  return { language: "cpp", codes: { ...PLAYGROUND_TEMPLATES } };
}

function readDraft(key: string): Draft {
  const draft = initialDraft();
  const raw = localStorage.getItem(key);
  if (!raw) return draft;
  const saved = JSON.parse(raw);
  if (!saved || typeof saved !== "object") return draft;
  if (LANGUAGE_KEYS.includes(saved.language)) draft.language = saved.language;
  for (const language of LANGUAGE_KEYS) {
    if (typeof saved.codes?.[language] === "string") draft.codes[language] = saved.codes[language];
  }
  return draft;
}

const noop = () => {};

export default function PlaygroundWorkspace({ userId }: { userId: string | null }) {
  const storageKey = `oj-playground-v1-${userId ?? "guest"}`;
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const draftRef = useRef(draft);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("載入草稿中…");
  const [formatting, setFormatting] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [error, setError] = useState("");
  const [terminalSource, setTerminalSource] = useState<{ language: LanguageKey; code: string; id: number } | null>(null);
  const [terminalBusy, setTerminalBusy] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const viewRef = useRef<EditorView | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const operationRef = useRef<"format" | "terminal" | null>(null);
  const terminalIdRef = useRef(0);
  const { language, codes } = draft;
  const code = codes[language];
  const limits = playgroundLimits(language);
  const busy = formatting || terminalBusy;

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const loaded = readDraft(userId && !localStorage.getItem(storageKey)
          ? "oj-playground-v1-guest" : storageKey);
        draftRef.current = loaded;
        setDraft(loaded);
        setSaveStatus("草稿儲存在此裝置");
      } catch {
        setSaveStatus("無法讀取此裝置的草稿");
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey, userId]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === workspaceRef.current);
      viewRef.current?.requestMeasure();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const updateDraft = useCallback((next: Draft) => {
    draftRef.current = next;
    setDraft(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSaveStatus("草稿已儲存在此裝置");
    } catch {
      setSaveStatus("草稿未儲存，請下載程式碼");
    }
  }, [storageKey]);

  const updateCode = useCallback((value: string) => {
    const current = draftRef.current;
    updateDraft({ ...current, codes: { ...current.codes, [current.language]: value } });
  }, [updateDraft]);

  const handleCreateEditor = useCallback((view: EditorView) => { viewRef.current = view; }, []);
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!event.ctrlKey || !event.deltaY) return;
    event.preventDefault();
    setFontSize((size) => Math.max(10, Math.min(24, size + (event.deltaY < 0 ? 1 : -1))));
  }, []);

  const formatCode = useCallback(async () => {
    const view = viewRef.current;
    if (!view || operationRef.current || !view.state.doc.toString().trim()) return;
    operationRef.current = "format";
    setFormatting(true);
    setError("");
    const original = view.state.doc;
    const originalLanguage = draftRef.current.language;
    try {
      const [{ formatEditorCode }, { applyEditorFormatting }] = await Promise.all([
        import("@/lib/editorFormatting"), import("@/lib/applyEditorFormatting"),
      ]);
      const formatted = await formatEditorCode(original.toString(), originalLanguage);
      if (viewRef.current === view && view.dom.isConnected && view.state.doc === original &&
          draftRef.current.language === originalLanguage) {
        applyEditorFormatting(view, formatted, original);
        view.focus();
      }
    } catch {
      setError("程式美化失敗，請確認程式碼語法");
    } finally {
      operationRef.current = null;
      setFormatting(false);
    }
  }, []);

  const onTerminalBusyChange = useCallback((value: boolean) => {
    if (terminalSource?.id !== terminalIdRef.current) return;
    if (value) operationRef.current = "terminal";
    else if (operationRef.current === "terminal") operationRef.current = null;
    setTerminalBusy(value);
  }, [terminalSource?.id]);
  const closeTerminal = useCallback(() => {
    terminalIdRef.current++;
    setTerminalSource(null);
    if (operationRef.current === "terminal") operationRef.current = null;
    setTerminalBusy(false);
  }, []);

  function startTerminal() {
    if (!userId || !ready || operationRef.current || !code.trim()) return;
    operationRef.current = "terminal";
    setTerminalBusy(true);
    setError("");
    setTerminalSource({ language, code, id: ++terminalIdRef.current });
  }

  function downloadCode() {
    const filename = language === "itoulang" ? "main.itou" : LANGUAGES[language].filename;
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importCode(file: File) {
    if (file.size > 65536) { setError("檔案過大，請選擇 64 KB 以內的程式碼"); return; }
    const current = draftRef.current;
    const extensions: Record<string, LanguageKey> = { cpp: "cpp", cc: "cpp", cxx: "cpp", c: "c", py: "python", js: "javascript", itou: "itoulang" };
    const nextLanguage = extensions[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? current.language;
    if (current.codes[nextLanguage] !== PLAYGROUND_TEMPLATES[nextLanguage] &&
        !window.confirm("匯入檔案會取代這個語言的草稿，要繼續嗎？")) return;
    try {
      const text = await file.text();
      if (operationRef.current || draftRef.current !== current) {
        setError("草稿已變更，請重新匯入檔案");
        return;
      }
      updateDraft({ ...current, language: nextLanguage, codes: { ...current.codes, [nextLanguage]: text } });
      setError("");
    } catch { setError("無法讀取檔案"); }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (workspaceRef.current?.requestFullscreen) await workspaceRef.current.requestFullscreen();
      else setError("此瀏覽器不支援全螢幕模式");
    } catch { setError("無法切換全螢幕模式"); }
  }

  return (
    <div ref={workspaceRef} className="playground-workspace card overflow-hidden" onKeyDown={(event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        startTerminal();
      }
    }}>
      {!userId && <div className="border-b border-bd bg-inset px-4 py-3 text-sm text-dim">
        可以先寫程式，<Link className="text-blue underline" href="/login?next=/playground">登入</Link>後即可執行。
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bd p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" aria-label="程式語言" value={language} disabled={!ready || busy}
            onChange={(event) => {
              updateDraft({ ...draftRef.current, language: event.target.value as LanguageKey });
            }}>
            {LANGUAGE_KEYS.map((key) => <option key={key} value={key}>{LANGUAGES[key].label}</option>)}
          </select>
          <button type="button" className="btn-secondary" disabled={!ready || busy || !code.trim()} onClick={() => void formatCode()}
            title="Shift + Alt + F" aria-keyshortcuts="Shift+Alt+F">{formatting ? "美化中…" : "程式美化"}</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary submit-panel-action" disabled={!userId || !ready || busy || !code.trim()}
            onClick={startTerminal} title="Ctrl / ⌘ + Enter" aria-keyshortcuts="Control+Enter Meta+Enter">
            {terminalBusy && <span className="submit-panel-action-spinner" aria-hidden="true" />}
            {terminalBusy ? "執行中…" : "▶ 執行程式"}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-bd bg-inset px-3 py-2">
        <span className="mono text-xs text-dim">{language === "itoulang" ? "main.itou" : LANGUAGES[language].filename}</span>
        <div className="flex flex-wrap items-center gap-3 text-xs text-dim">
          <button type="button" className="hover:text-tx disabled:opacity-40" disabled={!ready || busy} onClick={() => fileRef.current?.click()}>匯入</button>
          <button type="button" className="hover:text-tx disabled:opacity-40" disabled={!ready} onClick={downloadCode}>下載</button>
          <button type="button" className="hover:text-tx disabled:opacity-40" disabled={!ready || busy} onClick={() => {
            if (window.confirm("要將目前語言的程式碼重設為範例嗎？")) updateCode(PLAYGROUND_TEMPLATES[language]);
          }}>重設範例</button>
          <label className="flex items-center gap-1">字級
            <select className="rounded border border-bd bg-panel p-1" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))}>
              {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((size) => <option key={size}>{size}</option>)}
            </select>
          </label>
          <button type="button" className="hover:text-tx" onClick={() => void toggleFullscreen()}>{fullscreen ? "離開全螢幕" : "全螢幕"}</button>
        </div>
        <input ref={fileRef} type="file" className="hidden" accept=".cpp,.cc,.cxx,.c,.py,.js,.itou,.txt" onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importCode(file);
        }} />
      </div>
      <div className="playground-editor oj-editor" aria-label="程式碼編輯器">
        {ready && <CodeEditor code={code} language={language} fontSize={fontSize} onChange={updateCode}
          onCreateEditor={handleCreateEditor} onFocus={noop} onWheel={handleWheel} onFormat={formatCode} />}
      </div>
      <div className="flex flex-wrap justify-between gap-2 border-y border-bd px-3 py-2 text-xs text-mute">
        <span role="status">{saveStatus}</span>
        <span>執行上限 {limits.timeMs / 1000} 秒 · {limits.memoryMb} MB</span>
      </div>
      {error && <p className="px-4 pb-4 text-sm text-[#ff6b6b]" role="alert">{error}</p>}
      <InteractiveTerminal key={terminalSource?.id ?? "idle"} active={terminalSource !== null}
        startEndpoint="/api/playground/terminal" language={terminalSource?.language ?? language}
        code={terminalSource?.code ?? ""} onBusyChange={onTerminalBusyChange} onClose={closeTerminal} />
    </div>
  );
}
