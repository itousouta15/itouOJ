"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { LANGUAGES, type LanguageKey } from "@/lib/languages";
import {
  isNativeApp,
  onKeyboardWillHide,
  onKeyboardWillShow,
} from "@/lib/capacitor";
import DifficultyBadge from "@/components/DifficultyBadge";
import VerdictBadge from "@/components/VerdictBadge";

// App 鍵盤符號列：手機鍵盤要翻符號頁才打得出來的按鍵，點擊插入游標處。
// 兩排各 9 鍵（共 18），等寬塞滿螢幕不捲動；只在手機鍵盤出現時顯示。
const KBD_ROW1 = ["Tab", "{", "}", "(", ")", "[", "]", ";", ":"];
const KBD_ROW2 = ["'", '"', "#", "|", "&", "_", "*", "%", "^"];

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

const CM_EXTENSIONS: Record<LanguageKey, Extension[]> = {
  cpp: [cpp()],
  c: [cpp()],
  python: [python()],
  java: [java()],
  javascript: [javascript()],
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
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

    }
}
`,
  javascript: `const lines = require("fs").readFileSync(0, "utf8").split("\\n");
`,
};

interface SubmitPanelProps {
  problemId: number;
  contestId?: number;
  // 全螢幕編輯器題目頭顯示用（App 寫程式時）
  problem?: {
    order: number;
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
  problemId,
  contestId,
  problem,
  contestPhase,
  allowedLanguages,
}: SubmitPanelProps) {
  const locked = contestPhase === "ended";
  const router = useRouter();

  const languageOptions = (Object.keys(LANGUAGES) as LanguageKey[]).filter(
    (k) => !allowedLanguages || allowedLanguages.includes(k)
  );
  const defaultLanguage = languageOptions.includes("cpp")
    ? "cpp"
    : languageOptions[0] ?? "cpp";

  const [language, setLanguage] = useState<LanguageKey>(defaultLanguage);
  const [code, setCode] = useState(TEMPLATES[defaultLanguage]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [darkTheme, setDarkTheme] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [kbdVisible, setKbdVisible] = useState(false);
  const [isApp] = useState(() => isNativeApp());
  const viewRef = useRef<EditorView | null>(null);
  const restoreFocusRef = useRef(false);
  const closingRef = useRef(false);
  // 這次全螢幕是不是「點編輯器自動開」的：自動開的才在收鍵盤時自動關
  const autoOpenedRef = useRef(false);

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
        if (autoOpenedRef.current) closeFullscreen();
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
    setFullscreen(true);
  }

  // 記住上次選的語言、以及每題每語言打到一半的程式碼
  useEffect(() => {
    // 比賽限定語言時，不要把上次用的語言（可能是別的比賽用的）還原回來
    const saved = localStorage.getItem("oj-language") as LanguageKey | null;
    if (saved && languageOptions.includes(saved)) switchLanguage(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 編輯器跟著網站的亮暗主題（<html data-theme>）切換
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDarkTheme(el.getAttribute("data-theme") !== "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

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

  function draftKey(lang: LanguageKey) {
    return `oj-draft-${problemId}-${lang}`;
  }

  function switchLanguage(lang: LanguageKey) {
    setLanguage(lang);
    localStorage.setItem("oj-language", lang);
    setCode(localStorage.getItem(draftKey(lang)) ?? TEMPLATES[lang]);
  }

  function updateCode(value: string) {
    setCode(value);
    localStorage.setItem(draftKey(language), value);
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
          customInput: showCustom ? customInput : null,
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
      theme={darkTheme ? "dark" : "light"}
      extensions={CM_EXTENSIONS[language]}
      onChange={updateCode}
      onCreateEditor={(view) => {
        viewRef.current = view;
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
        className="btn-secondary"
        onClick={runTest}
        disabled={running || submitting || locked}
      >
        {running ? "執行中…" : "測試執行"}
      </button>
      <button
        className="btn-primary"
        onClick={submit}
        disabled={running || submitting || locked}
      >
        {submitting ? "送出中…" : "送出解答"}
      </button>
    </>
  );

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
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
          {editor}
        </div>
      )}
      {showCustom && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium">
            自訂輸入（stdin）
          </label>
          <textarea
            className="input mono min-h-24 resize-y text-[13px]"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="測試執行時會用這裡的內容當輸入"
          />
        </div>
      )}

      {locked && (
        <p className="mt-2 text-sm text-[#faa81a]">比賽已結束，無法再測試執行或提交</p>
      )}
      {error && <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          className={`pill ${showCustom ? "pill-active" : ""}`}
          onClick={() => setShowCustom((v) => !v)}
        >
          自訂輸入
        </button>
        <div className="flex gap-3">{actionButtons}</div>
      </div>

      {runResult && (
        <div className="mt-4 space-y-3 border-t border-bd pt-4">
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
                    #{problem.order} ・ 時間 {problem.timeLimitMs} ms ・ 記憶體{" "}
                    {problem.memoryLimitMb} MB
                  </p>
                )}
              </div>
              <div className="flex flex-none items-center gap-2">
                {langSelect}
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
            <div className="editor-fullscreen-body oj-editor overflow-hidden">
              {editor}
            </div>
            {showCustom && (
              <div className="flex-none px-4 pb-2">
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
