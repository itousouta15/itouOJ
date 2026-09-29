"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import {
  acceptCompletion,
  clearSnippet,
  nextSnippetField,
  prevSnippetField,
  snippetKeymap,
} from "@codemirror/autocomplete";
import { Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap, tooltips } from "@codemirror/view";
import { LANGUAGES, type LanguageKey } from "@/lib/languages";
import { DOCUMENT_WORD_COMPLETIONS, EDITOR_COMPLETIONS } from "@/lib/editorCompletions";
import {
  isNativeApp,
  onKeyboardWillHide,
  onKeyboardWillShow,
} from "@/lib/capacitor";
import DifficultyBadge from "@/components/DifficultyBadge";
import VerdictBadge from "@/components/VerdictBadge";
import InteractiveTerminal from "@/components/InteractiveTerminal";
import { setProblemWorkspaceTab } from "@/lib/problemWorkspaceTab";
import { useHorizontalSwipe } from "@/lib/useHorizontalSwipe";
import { useSyncedDraft } from "@/lib/useSyncedDraft";

// App 鍵盤符號列：手機鍵盤要翻符號頁才打得出來的按鍵，點擊插入游標處。
// 兩排各 9 鍵（共 18），等寬塞滿螢幕不捲動；只在手機鍵盤出現時顯示。
const KBD_ROW1 = ["Tab", "{", "}", "(", ")", "[", "]", ";", ":"];
const KBD_ROW2 = ["'", '"', "#", "|", "&", "_", "*", "%", "^"];
const DEFAULT_EDITOR_FONT_SIZE = 15;
const MIN_EDITOR_FONT_SIZE = 10;
const MAX_EDITOR_FONT_SIZE = 24;
// 補全開啟時 Tab 選取建議；沒有建議時退回原本的縮排或片段欄位切換。
const ACCEPT_COMPLETION_WITH_TAB = Prec.highest(keymap.of([
  { key: "Tab", run: acceptCompletion },
]));
const SNIPPET_KEYS = snippetKeymap.of([
  { key: "Tab", run: (view) => acceptCompletion(view) || nextSnippetField(view), shift: prevSnippetField },
  { key: "Escape", run: clearSnippet },
]);

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

function withCompletions(key: LanguageKey, support: ReturnType<typeof cpp>): Extension[] {
  return [
    support,
    support.language.data.of({ autocomplete: EDITOR_COMPLETIONS[key] }),
    ...(["cpp", "c"].includes(key)
      ? [support.language.data.of({ autocomplete: DOCUMENT_WORD_COMPLETIONS })]
      : []),
  ];
}

const CM_EXTENSIONS: Record<LanguageKey, Extension[]> = {
  cpp: withCompletions("cpp", cpp()),
  c: withCompletions("c", cpp()),
  python: withCompletions("python", python()),
  javascript: withCompletions("javascript", javascript()),
};

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [terminalRun, setTerminalRun] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalBusy, setTerminalBusy] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(DEFAULT_EDITOR_FONT_SIZE);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenView, setFullscreenView] = useState<"code" | "problem">("code");
  const [closing, setClosing] = useState(false);
  const [kbdVisible, setKbdVisible] = useState(false);
  const [isApp] = useState(() => isNativeApp());
  const viewRef = useRef<EditorView | null>(null);
  const wheelDeltaRef = useRef(0);
  // 讓 CodeMirror 自己處理字級變更與重新測量，行號才會跟程式碼維持同一行高。
  const editorExtensions = useMemo(
    () => [
      ...CM_EXTENSIONS[language],
      ACCEPT_COMPLETION_WITH_TAB,
      SNIPPET_KEYS,
      // 編輯器與側欄有 overflow，選單放在 body 才不會被裁掉，也能用滑鼠點選。
      ...(typeof document !== "undefined" ? [tooltips({ parent: document.body })] : []),
      EditorView.theme({ "&": { fontSize: `${editorFontSize}px` } }),
    ],
    [language, editorFontSize],
  );
  const restoreFocusRef = useRef(false);
  const closingRef = useRef(false);
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
    setTimeout(() => {
      closingRef.current = false;
      setClosing(false);
      setFullscreen(false);
    }, 180);
  }, [isApp]);

  // App 內：手機鍵盤開/關事件 —— 關閉時自動開的全螢幕編輯器回到內嵌模式；
  // 符號列只在鍵盤出現時顯示。
  useEffect(() => {
    if (!isApp) return;
    let cleanup: () => void = () => {};
    Promise.all([
      onKeyboardWillHide(() => {
        setKbdVisible(false);
        if (autoOpenedRef.current && fullscreenViewRef.current === "code") closeFullscreen();
      }),
      onKeyboardWillShow(() => setKbdVisible(true)),
    ]).then(([unsubHide, unsubShow]) => {
      cleanup = () => {
        unsubHide();
        unsubShow();
      };
    });
    return () => cleanup();
  }, [closeFullscreen, isApp]);

  function openFullscreen(manual: boolean) {
    closingRef.current = false;
    setClosing(false);
    autoOpenedRef.current = !manual;
    fullscreenViewRef.current = "code";
    setFullscreenView("code");
    setProblemWorkspaceTab("code");
    setFullscreen(true);
  }

  // 全螢幕編輯時鎖住頁面捲動
  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [fullscreen, closeFullscreen]);

  function handleEditorWheel(event: WheelEvent) {
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
  }

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

  // 測試執行：跑範例測資（或自訂輸入），不留紀錄
  async function runTest() {
    if (locked) return;
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
          customInput: showCustom && (window.innerWidth < 1024 || fullscreen)
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
    if (locked) return;
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
      disabled={terminalBusy}
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

  const editor = (
    <CodeMirror
      value={code}
      theme="dark"
      extensions={editorExtensions}
      onChange={updateCode}
      onCreateEditor={(view) => {
        viewRef.current = view;
        view.dom.addEventListener("wheel", handleEditorWheel, { passive: false });
        if (fullscreen || restoreFocusRef.current) {
          restoreFocusRef.current = false;
          requestAnimationFrame(() => view.focus());
        }
      }}
      onFocus={() => {
        // App 手機上點程式區塊 → 自動進全螢幕編輯（鍵盤符號列才會出現）
        if (isApp && !fullscreen && window.innerWidth < 768) {
          openFullscreen(false);
        }
      }}
      basicSetup={{ tabSize: 4 }}
    />
  );

  const actionButtons = (
    <>
      <button
        className="btn-secondary submit-panel-action"
        onClick={runTest}
        disabled={running || submitting || terminalBusy || locked}
      >
        {running && <span className="submit-panel-action-spinner" aria-hidden="true" />}
        {running ? "執行中…" : "測試執行"}
      </button>
      <button
        className="btn-primary submit-panel-action"
        onClick={submit}
        disabled={running || submitting || terminalBusy || locked}
      >
        {submitting && <span className="submit-panel-action-spinner" aria-hidden="true" />}
        {submitting ? "送出中…" : "送出解答"}
      </button>
    </>
  );

  const customInputField = (
    <textarea
      className="input mono min-h-24 resize-y text-[13px]"
      value={customInput}
      onChange={(e) => setCustomInput(e.target.value)}
      placeholder="測試執行時會用這裡的內容當輸入"
    />
  );

  const draftNotice = (
    <>
      <div className="submit-panel-notice mt-2 text-xs text-dim" role="status">{draftStatus}</div>
      {draftConflict && (
        <div className="submit-panel-notice mt-2 flex flex-wrap items-center gap-2 text-sm" role="alert">
          <span>此裝置的草稿與帳號中的版本不同。請選擇保留哪一份：</span>
          <button type="button" className="btn-secondary" onClick={keepLocal}>保留此裝置</button>
          <button type="button" className="btn-secondary" onClick={keepCloud}>使用帳號版本</button>
        </div>
      )}
    </>
  );

  return (
    <div className="card submit-panel p-4">
      <div className="mb-3 flex items-center justify-between lg:hidden">
        <h2 className="section-title">提交</h2>
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
            <h2 className="section-title">提交</h2>
            {langSelect}
          </div>
          <div className="submit-panel-editor-body">
            <div className="submit-panel-editor-viewport">{editor}</div>
            <div className="submit-panel-editor-toolbar hidden lg:flex">
              <div className="submit-panel-editor-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={running || submitting || terminalBusy || locked}
                  title="開啟終端機互動執行"
                  onClick={() => {
                    setShowCustom(false);
                    setRunResult(null);
                    setTerminalRun((value) => value + 1);
                    setShowTerminal(true);
                  }}
                >
                  Terminal
                </button>
                {actionButtons}
              </div>
            </div>
          </div>
          {showTerminal && (
            <InteractiveTerminal
              key={terminalRun}
              problemId={problemId}
              contestId={contestId}
              language={language}
              code={code}
              onBusyChange={setTerminalBusy}
              onClose={() => setShowTerminal(false)}
            />
          )}
        </div>
      )}
      {showCustom && (
        <div className="mt-3 lg:hidden">
          <label className="mb-1 block text-sm font-medium">
            自訂輸入（stdin）
          </label>
          {customInputField}
        </div>
      )}

      {locked && (
        <p className="submit-panel-notice mt-2 text-sm text-[#faa81a]">比賽已結束，無法再測試執行或提交</p>
      )}
      {draftNotice}
      {error && <p className="submit-panel-notice mt-2 text-sm text-[#ff6b6b]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <button
          className={`pill ${showCustom ? "pill-active" : ""}`}
          onClick={() => setShowCustom((v) => !v)}
        >
          自訂輸入
        </button>
        <div className="flex gap-3">{actionButtons}</div>
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
                {problem && (
                  <p className="mono pl-1 text-[11px] text-mute">
                    {problem.problemCode} ・ 時間 {problem.timeLimitMs} ms ・ 記憶體{" "}
                    {problem.memoryLimitMb} MB
                  </p>
                )}
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
            <div className="flex-none px-4 pb-2">{draftNotice}</div>
            {showCustom && (
              <div className="editor-fullscreen-custom flex-none px-4 pb-2">
                <textarea
                  className="input mono min-h-20 resize-y text-[13px]"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="自訂輸入（stdin），測試執行時會用這裡的內容"
                />
              </div>
            )}
            <div className="editor-fullscreen-toolbar">
              <button
                className={`pill flex-none ${showCustom ? "pill-active" : ""}`}
                onClick={() => setShowCustom((v) => !v)}
              >
                自訂輸入
              </button>
              <div className="flex flex-1 items-center justify-end gap-3">
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
