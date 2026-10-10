"use client";

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import type { EditorView } from "@codemirror/view";
import { LANGUAGES, type LanguageKey } from "@/lib/languages";
import {
  isNativeApp,
  onKeyboardWillHide,
  onKeyboardWillShow,
} from "@/lib/capacitor";
import DifficultyBadge from "@/components/DifficultyBadge";
import VerdictBadge from "@/components/VerdictBadge";
import { setProblemWorkspaceTab } from "@/lib/problemWorkspaceTab";
import { useHorizontalSwipe } from "@/lib/useHorizontalSwipe";
import { useSyncedDraft } from "@/lib/useSyncedDraft";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => <p className="p-3 text-sm text-dim" role="status">載入編輯器中…</p>,
});
const InteractiveTerminal = lazy(() => import("@/components/InteractiveTerminal"));

function TerminalLoading({ mobile, onClose }: { mobile: boolean; onClose: () => void }) {
  const loading = (
    <div
      className={mobile ? "mobile-terminal-overlay" : "interactive-terminal"}
      role={mobile ? "dialog" : undefined}
      aria-modal={mobile ? true : undefined}
      aria-label={mobile ? "Terminal 互動執行" : undefined}
    >
      <div className="flex w-full items-start justify-between gap-3 p-4">
        <p role="status">載入終端機中…</p>
        <button type="button" className="btn-secondary" onClick={onClose} autoFocus={mobile}>取消</button>
      </div>
    </div>
  );
  return mobile ? createPortal(loading, document.body) : loading;
}

// App 鍵盤符號列：手機鍵盤要翻符號頁才打得出來的按鍵，點擊插入游標處。
// 兩排各 9 鍵（共 18），等寬塞滿螢幕不捲動；只在手機鍵盤出現時顯示。
const KBD_ROW1 = ["Tab", "{", "}", "(", ")", "[", "]", ";", ":"];
const KBD_ROW2 = ["'", '"', "#", "|", "&", "_", "*", "%", "^"];
const DEFAULT_EDITOR_FONT_SIZE = 15;
const MIN_EDITOR_FONT_SIZE = 10;
const MAX_EDITOR_FONT_SIZE = 24;

interface SampleRunResult {
  order: number;
  verdict: string;
  timeMs: number;
  stdout: string;
  expected: string;
  stderr: string;
}

interface RunResponse {
  mode: "samples" | "custom";
  compileError?: string;
  results?: SampleRunResult[];
  stdout?: string;
  stderr?: string;
  exitCode?: number | null;
  killed?: boolean;
  timeMs?: number;
}

const TEMPLATES: Record<LanguageKey, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    return 0;
}
`,
  c: `#include <stdio.h>

int main(void) {

    return 0;
}
`,
  python: ``,
  javascript: `const lines = require("fs").readFileSync(0, "utf8").split("\\n");
`,
  itoulang: `// 喵～ 讀入測資並輸出答案。
令 第一行 = 讀行();
喵(第一行);
`,
};

interface SubmitPanelProps {
  userId: string;
  problemId: number;
  contestId?: number;
  question?: ReactNode;
  // 全螢幕編輯器題目頭顯示用（App 寫程式時）
  problem?: {
    problemCode: string | null;
    title: string;
    difficulty: string;
    timeLimitMs: number;
    memoryLimitMb: number;
    accepted: boolean;
  };
  // 只有透過比賽內題目頁才會傳這個；ended 時停用送出/測試執行
  contestPhase?: "running" | "frozen" | "ended";
  // 比賽限定語言時只列出這些；null = 不限制
  allowedLanguages?: string[] | null;
}

export default function SubmitPanel({
  userId,
  problemId,
  contestId,
  question,
  problem,
  contestPhase,
  allowedLanguages,
}: SubmitPanelProps) {
  const locked = contestPhase === "ended";
  const router = useRouter();

  const languageOptions = useMemo(
    () => (Object.keys(LANGUAGES) as LanguageKey[]).filter(
      (k) => !allowedLanguages || allowedLanguages.includes(k)
    ),
    [allowedLanguages]
  );
  const defaultLanguage = languageOptions.includes("cpp")
    ? "cpp"
    : languageOptions[0] ?? "cpp";

  const {
    language, code, status: draftStatus, conflict: draftConflict,
    switchLanguage, updateCode, keepLocal, keepCloud,
  } = useSyncedDraft({ userId, problemId, contestId, defaultLanguage, languageOptions, templates: TEMPLATES });
  // 有些語言（如 itouLang）的執行模型不支援逐行互動終端。
  const canTerminal = LANGUAGES[language].interactive;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formatting, setFormatting] = useState(false);
  const formattingRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [terminalRun, setTerminalRun] = useState(0);
  const [terminalSource, setTerminalSource] = useState<{ code: string; language: LanguageKey } | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [mobileTerminal, setMobileTerminal] = useState(false);
  const [terminalBusy, setTerminalBusy] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(DEFAULT_EDITOR_FONT_SIZE);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenView, setFullscreenView] = useState<"code" | "problem">("code");
  const [closing, setClosing] = useState(false);
  const [kbdVisible, setKbdVisible] = useState(false);
  const [isApp] = useState(() => isNativeApp());
  const viewRef = useRef<EditorView | null>(null);
  const wheelDeltaRef = useRef(0);
  const restoreFocusRef = useRef(false);
  const closingRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 這次全螢幕是不是「點編輯器自動開」的：自動開的才在收鍵盤時自動關
  const autoOpenedRef = useRef(false);
  const fullscreenViewRef = useRef<"code" | "problem">("code");

  function showFullscreenView(view: "code" | "problem") {
    if (!question || fullscreenViewRef.current === view) return;
    fullscreenViewRef.current = view;
    if (view === "problem") {
      // 收鍵盤時仍留在全螢幕，回來後沿用原本的 CodeMirror 與草稿。
      viewRef.current?.contentDOM.blur();
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement.matches("textarea, input, select")) {
        activeElement.blur();
      }
      setKbdVisible(false);
    }
    setFullscreenView(view);
    setProblemWorkspaceTab(view);
    if (view === "code") requestAnimationFrame(() => viewRef.current?.requestMeasure());
  }

  const fullscreenSwipe = useHorizontalSwipe((direction) => {
    showFullscreenView(direction === "left" ? "code" : "problem");
  });

  // 全螢幕開啟後把焦點移到編輯器（鍵盤隨之彈出）
  useEffect(() => {
    if (fullscreen) viewRef.current?.focus();
  }, [fullscreen]);

  const closeFullscreen = useCallback(() => {
    // App 退出時絕不能把焦點還給內嵌編輯器：那會再次觸發自動全螢幕與鍵盤。
    if (closingRef.current) return;
    closingRef.current = true;
    autoOpenedRef.current = false;
    restoreFocusRef.current = !isApp;
    if (isApp) viewRef.current?.contentDOM.blur();
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      closingRef.current = false;
      setClosing(false);
      setFullscreen(false);
    }, 180);
  }, [isApp]);

  useEffect(() => {
    const timer = closeTimerRef;
    return () => { if (timer.current !== null) clearTimeout(timer.current); };
  }, []);

  // App 內：手機鍵盤開/關事件 —— 關閉時自動開的全螢幕編輯器回到內嵌模式；
  // 符號列只在鍵盤出現時顯示。
  useEffect(() => {
    if (!isApp) return;
    let disposed = false;
    const subscriptions: Array<() => void> = [];
    const register = (subscription: Promise<() => void>) => {
      void subscription.then((unsubscribe) => {
        if (disposed) unsubscribe();
        else subscriptions.push(unsubscribe);
      }).catch(() => {});
    };
    register(onKeyboardWillHide(() => {
      if (disposed) return;
      setKbdVisible(false);
      if (autoOpenedRef.current && fullscreenViewRef.current === "code") closeFullscreen();
    }));
    register(onKeyboardWillShow(() => { if (!disposed) setKbdVisible(true); }));
    return () => {
      disposed = true;
      for (const unsubscribe of subscriptions) unsubscribe();
    };
  }, [closeFullscreen, isApp]);

  const openFullscreen = useCallback((manual: boolean) => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    closingRef.current = false;
    setClosing(false);
    autoOpenedRef.current = !manual;
    fullscreenViewRef.current = "code";
    setFullscreenView("code");
    setProblemWorkspaceTab("code");
    setFullscreen(true);
  }, []);

  // 全螢幕編輯時鎖住頁面捲動
  useEffect(() => {
    if (!fullscreen && !(showTerminal && mobileTerminal)) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen, showTerminal, mobileTerminal]);

  useEffect(() => {
    if (!fullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [fullscreen, closeFullscreen]);

  const handleEditorWheel = useCallback((event: WheelEvent) => {
    if (!event.ctrlKey) {
      wheelDeltaRef.current = 0;
      return;
    }
    event.preventDefault();
    if (!event.deltaY) return;

    // 滑鼠滾輪一格約 100px；觸控板的細小位移累積後才調整，避免縮放過快。
    const delta = event.deltaY * (event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? 100 : 1);
    if (Math.sign(delta) !== Math.sign(wheelDeltaRef.current)) wheelDeltaRef.current = 0;
    wheelDeltaRef.current += delta;
    const steps = Math.trunc(wheelDeltaRef.current / 100);
    if (!steps) return;
    wheelDeltaRef.current -= steps * 100;
    setEditorFontSize((size) =>
      Math.max(MIN_EDITOR_FONT_SIZE, Math.min(MAX_EDITOR_FONT_SIZE, size - steps))
    );
  }, []);

  // 鍵盤符號列：在游標處插入文字（Tab 用兩格空白）
  function insertText(text: string) {
    const view = viewRef.current;
    if (!view) return;
    const insert = text === "Tab" ? "  " : text;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
    });
    view.focus();
  }

  const formatCode = useCallback(async () => {
    const view = viewRef.current;
    if (!view || formattingRef.current || running || submitting || terminalBusy) return;
    const original = view.state.doc;
    const source = original.toString();
    if (!source.trim()) return;

    formattingRef.current = true;
    setFormatting(true);
    try {
      const [{ formatEditorCode }, { applyEditorFormatting }] = await Promise.all([
        import("@/lib/editorFormatting"),
        import("@/lib/applyEditorFormatting"),
      ]);
      const formatted = await formatEditorCode(source, language);
      // 載入工具期間仍可編輯；若草稿或編輯器已變更，就不套用舊結果。
      if (viewRef.current !== view || !view.dom.isConnected || view.state.doc !== original) {
        return;
      }
      if (formatted === source) {
        return;
      }

      applyEditorFormatting(view, formatted, original);
      view.focus();
    } catch {
    } finally {
      formattingRef.current = false;
      setFormatting(false);
    }
  }, [language, running, submitting, terminalBusy]);

  // 測試執行：跑範例測資（或自訂輸入），不留紀錄
  async function runTest() {
    if (locked || formattingRef.current) return;
    setRunning(true);
    setError("");
    setRunResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          language,
          code,
          customInput: showCustom && fullscreen && window.innerWidth >= 1024
            ? customInput
            : null,
          contestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "執行失敗");
        return;
      }
      setRunResult(data);
    } catch {
      setError("執行失敗，請稍後再試");
    } finally {
      setRunning(false);
    }
  }

  async function submit() {
    if (locked || formattingRef.current) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, language, code, contestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "提交失敗");
        setSubmitting(false);
        return;
      }
      router.push(`/submissions/${data.id}`);
    } catch {
      setError("提交失敗，請稍後再試");
      setSubmitting(false);
    }
  }

  const langSelect = (
    <select
      className="input w-auto"
      aria-label="程式語言"
      disabled={terminalBusy || formatting}
      value={language}
      onChange={(e) => switchLanguage(e.target.value as LanguageKey)}
    >
      {languageOptions.map((key) => (
        <option key={key} value={key}>
          {LANGUAGES[key].label}
        </option>
      ))}
    </select>
  );

  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
    if (fullscreen || restoreFocusRef.current) {
      restoreFocusRef.current = false;
      requestAnimationFrame(() => { if (view.dom.isConnected) view.focus(); });
    }
  }, [fullscreen]);

  const handleEditorFocus = useCallback(() => {
    if (isApp && !fullscreen && window.innerWidth < 768) openFullscreen(false);
  }, [isApp, fullscreen, openFullscreen]);

  const handleTerminalClose = useCallback(() => {
    setShowTerminal(false);
    setTerminalBusy(false);
  }, []);

  const editor = (
    <CodeEditor
      code={code}
      language={language}
      fontSize={editorFontSize}
      onChange={updateCode}
      onCreateEditor={handleCreateEditor}
      onFocus={handleEditorFocus}
      onWheel={handleEditorWheel}
      onFormat={formatCode}
    />
  );

  const actionButtons = (
    <>
      <button
        className="btn-secondary submit-panel-action"
        onClick={runTest}
        disabled={running || submitting || terminalBusy || formatting || locked}
      >
        {running && <span className="submit-panel-action-spinner" aria-hidden="true" />}
        {running ? "執行中…" : "測試執行"}
      </button>
      <button
        className="btn-primary submit-panel-action"
        onClick={submit}
        disabled={running || submitting || terminalBusy || formatting || locked}
      >
        {submitting && <span className="submit-panel-action-spinner" aria-hidden="true" />}
        {submitting ? "送出中…" : "送出解答"}
      </button>
    </>
  );

  const draftStatusLabel = (
    <span className="min-w-0 truncate text-xs text-dim" role="status" title={draftStatus}>{draftStatus}</span>
  );

  const terminalButton = (
    <button
      type="button"
      className="btn-secondary submit-panel-action"
      disabled={running || submitting || terminalBusy || formatting || locked}
      title="開啟終端機互動執行"
      onClick={() => {
        if (locked || running || submitting || terminalBusy || formattingRef.current) return;
        // 終端機的鍵盤開關不應讓背後的 App 編輯器自動退出全螢幕。
        autoOpenedRef.current = false;
        setMobileTerminal(window.innerWidth < 1024 || fullscreen);
        setShowCustom(false);
        setRunResult(null);
        setTerminalBusy(true);
        setTerminalSource({ code, language });
        setTerminalRun((value) => value + 1);
        setShowTerminal(true);
      }}
    >
      Terminal
    </button>
  );

  const formatButton = (
    <button
      type="button"
      className="btn-secondary submit-panel-action shrink-0"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => { void formatCode(); }}
      disabled={formatting || running || submitting || terminalBusy || !code.trim()}
      title="美化整份程式碼（Shift + Alt + F）"
      aria-keyshortcuts="Shift+Alt+F"
    >
      {formatting && <span className="submit-panel-action-spinner" aria-hidden="true" />}
      {formatting ? "美化中…" : "程式美化"}
    </button>
  );



  const draftConflictNotice = draftConflict && (
    <div className="submit-panel-notice mt-2 flex flex-wrap items-center gap-2 text-sm" role="alert">
      <span>此裝置的草稿與帳號中的版本不同。請選擇保留哪一份：</span>
      <button type="button" className="btn-secondary" onClick={keepLocal}>保留此裝置</button>
      <button type="button" className="btn-secondary" onClick={keepCloud}>使用帳號版本</button>
    </div>
  );

  return (
    <div className="card submit-panel p-4" inert={showTerminal && mobileTerminal}>
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="section-title shrink-0">提交</h2>
          {!fullscreen && draftStatusLabel}
        </div>
        <div className="flex items-center gap-2">
          {langSelect}
          <button
            type="button"
            className="theme-btn"
            onClick={() => openFullscreen(true)}
            aria-label="全螢幕編輯"
            title="全螢幕編輯"
          >
            ⛶
          </button>
        </div>
      </div>
      {!fullscreen && (
        <div className="oj-editor oj-editor--inline overflow-hidden rounded-md border border-bd">
          <div className="submit-panel-editor-head hidden lg:flex">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="section-title shrink-0">提交</h2>
              {draftStatusLabel}
            </div>
            <div className="flex items-center gap-2">
              {formatButton}
              {langSelect}
            </div>
          </div>
          <div className="submit-panel-editor-body">
            <div className="submit-panel-editor-viewport">{editor}</div>
            <div className="submit-panel-editor-toolbar hidden lg:flex">
              <div className="submit-panel-editor-actions">
                {canTerminal && terminalButton}
                {actionButtons}
              </div>
            </div>
          </div>
        </div>
      )}
      {showTerminal && (
        <Suspense fallback={<TerminalLoading mobile={mobileTerminal} onClose={handleTerminalClose} />}>
          <InteractiveTerminal
            key={terminalRun}
            problemId={problemId}
            contestId={contestId}
            language={terminalSource?.language ?? language}
            code={terminalSource?.code ?? code}
            mobile={mobileTerminal}
            onBusyChange={setTerminalBusy}
            onClose={handleTerminalClose}
          />
        </Suspense>
      )}

      {locked && (
        <p className="submit-panel-notice mt-2 text-sm text-[#faa81a]">比賽已結束，無法再測試執行或提交</p>
      )}
      {draftConflictNotice}
      {error && <p className="submit-panel-notice mt-2 text-sm text-[#ff6b6b]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3 lg:hidden">
        <div className="flex flex-wrap gap-3">{canTerminal && terminalButton}{actionButtons}</div>
      </div>

      {runResult && (
        <div className="submit-panel-result mt-4 space-y-3 border-t border-bd pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-dim">測試結果</h3>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-dim hover:text-tx focus-visible:outline-2 focus-visible:outline-blue"
              onClick={() => setRunResult(null)}
              aria-label="關閉測試結果"
              title="關閉測試結果"
            >
              ✕
            </button>
          </div>
          {runResult.compileError ? (
            <div>
              <p className="mb-1 text-sm font-medium text-[#ff6b6b]">
                編譯錯誤
              </p>
              <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-xs whitespace-pre-wrap text-[#ff6b6b]">
                {runResult.compileError}
              </pre>
            </div>
          ) : runResult.mode === "samples" ? (
            runResult.results!.map((r) => (
              <div key={r.order} className="rounded-md border border-bd p-3">
                <div className="flex items-center gap-3">
                  <span className="mono text-xs text-dim">範例 {r.order}</span>
                  <VerdictBadge status={r.verdict} short />
                  <span className="mono text-xs text-mute">{r.timeMs} ms</span>
                </div>
                {r.verdict === "WA" && (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold text-dim">
                        你的輸出
                      </p>
                      <pre className="overflow-x-auto rounded bg-inset p-2 font-mono text-xs whitespace-pre-wrap">
                        {r.stdout || "（沒有輸出）"}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-semibold text-dim">
                        預期輸出
                      </p>
                      <pre className="overflow-x-auto rounded bg-inset p-2 font-mono text-xs whitespace-pre-wrap">
                        {r.expected}
                      </pre>
                    </div>
                  </div>
                )}
                {r.verdict === "RE" && r.stderr && (
                  <pre className="mt-2 overflow-x-auto rounded bg-inset p-2 font-mono text-xs whitespace-pre-wrap text-[#ff6b6b]">
                    {r.stderr}
                  </pre>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-md border border-bd p-3">
              <div className="flex items-center gap-3">
                <span className="mono text-xs text-dim">自訂輸入執行結果</span>
                <span className="mono text-xs text-mute">
                  {runResult.timeMs} ms
                </span>
                {runResult.killed && (
                  <span className="vbadge vbadge-amber">超過時間/記憶體限制</span>
                )}
                {!runResult.killed && runResult.exitCode !== 0 && (
                  <span className="vbadge vbadge-red">
                    exit code {runResult.exitCode}
                  </span>
                )}
              </div>
              <p className="mt-2 mb-1 text-xs font-semibold text-dim">輸出</p>
              <pre className="overflow-x-auto rounded bg-inset p-2 font-mono text-xs whitespace-pre-wrap">
                {runResult.stdout || "（沒有輸出）"}
              </pre>
              {runResult.stderr && (
                <>
                  <p className="mt-2 mb-1 text-xs font-semibold text-dim">
                    stderr
                  </p>
                  <pre className="overflow-x-auto rounded bg-inset p-2 font-mono text-xs whitespace-pre-wrap text-[#ff6b6b]">
                    {runResult.stderr}
                  </pre>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 全螢幕編輯模式（手機為主）：portal 掛到 body，佔滿整支螢幕，
          工具列吸底，送出/測試執行不用捲回頁尾。
          App 內點編輯器會自動進來（openFullscreen(false)），收鍵盤自動離開 */}
      {typeof document !== "undefined" &&
        fullscreen &&
        createPortal(
          <div
            className={`editor-fullscreen${closing ? " editor-fullscreen--closing" : ""}`}
            inert={showTerminal && mobileTerminal}
            data-view={fullscreenView}
            onTouchStart={(event) => {
              event.stopPropagation();
              fullscreenSwipe.onTouchStart(event);
            }}
            onTouchEnd={(event) => {
              event.stopPropagation();
              fullscreenSwipe.onTouchEnd(event);
            }}
            onTouchCancel={(event) => {
              event.stopPropagation();
              fullscreenSwipe.onTouchCancel();
            }}
          >
            <div className="editor-fullscreen-head">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  {problem && (
                    <DifficultyBadge difficulty={problem.difficulty} />
                  )}
                  <h2 className="min-w-0 flex-1 truncate text-[15px] font-bold leading-tight">
                    {problem ? problem.title : `題目 #${problemId}`}
                  </h2>
                  {problem?.accepted && (
                    <span className="editor-ac-pill">已 AC</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                  {problem && (
                    <p className="mono pl-1 text-[11px] text-mute">
                      {problem.problemCode} ・ 時間 {problem.timeLimitMs} ms ・ 記憶體{" "}
                      {problem.memoryLimitMb} MB
                    </p>
                  )}
                  {draftStatusLabel}
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                {fullscreenView === "code" && langSelect}
                <button
                  type="button"
                  className="theme-btn"
                  onClick={closeFullscreen}
                  aria-label="離開全螢幕編輯"
                  title="離開全螢幕"
                >
                  ✕
                </button>
              </div>
            </div>
            {question && (
              <div className="editor-fullscreen-tabs" role="tablist" aria-label="題目與程式">
                <button
                  type="button"
                  role="tab"
                  aria-selected={fullscreenView === "problem"}
                  aria-controls="fullscreen-question"
                  onClick={() => showFullscreenView("problem")}
                >
                  題目
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={fullscreenView === "code"}
                  aria-controls="fullscreen-code"
                  onClick={() => showFullscreenView("code")}
                >
                  程式
                </button>
              </div>
            )}
            {question && (
              <section
                id="fullscreen-question"
                role="tabpanel"
                className="editor-fullscreen-question space-y-6"
                inert={fullscreenView !== "problem"}
                aria-label="題目內容"
              >
                {question}
              </section>
            )}
            <div
              id="fullscreen-code"
              role={question ? "tabpanel" : undefined}
              className="editor-fullscreen-body oj-editor overflow-hidden"
              inert={fullscreenView === "problem"}
            >
              {editor}
            </div>
            {draftConflict && <div className="flex-none px-4 pb-2">{draftConflictNotice}</div>}
            {showCustom && (
              <div className="editor-fullscreen-custom hidden flex-none px-4 pb-2 lg:block">
                <textarea
                  className="input mono min-h-20 resize-y text-[13px]"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="自訂輸入（stdin），測試執行時會用這裡的內容"
                />
              </div>
            )}
            <div className="editor-fullscreen-toolbar">
              <div className="hidden items-center gap-3 lg:flex">
                {formatButton}
                <button
                  className={`pill flex-none ${showCustom ? "pill-active" : ""}`}
                  onClick={() => setShowCustom((v) => !v)}
                >
                  自訂輸入
                </button>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                {canTerminal && terminalButton}
                {actionButtons}
              </div>
            </div>
            {isApp && kbdVisible && (
              <div className="editor-kbd" role="toolbar" aria-label="程式符號鍵盤">
                <div className="editor-kbd-row">
                  {KBD_ROW1.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="editor-kbd-key"
                      onClick={() => insertText(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <div className="editor-kbd-row">
                  {KBD_ROW2.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className="editor-kbd-key"
                      onClick={() => insertText(k)}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
