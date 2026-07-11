"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import type { Extension } from "@codemirror/state";
import { LANGUAGES, type LanguageKey } from "@/lib/languages";
import VerdictBadge from "@/components/VerdictBadge";

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

export default function SubmitPanel({ problemId }: { problemId: number }) {
  const router = useRouter();
  const [language, setLanguage] = useState<LanguageKey>("cpp");
  const [code, setCode] = useState(TEMPLATES.cpp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [darkTheme, setDarkTheme] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");

  // 記住上次選的語言、以及每題每語言打到一半的程式碼
  useEffect(() => {
    const saved = localStorage.getItem("oj-language") as LanguageKey | null;
    if (saved && saved in LANGUAGES) switchLanguage(saved);
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

  // 測試執行：跑範例測資（或自訂輸入），不留紀錄
  async function runTest() {
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
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, language, code }),
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

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">提交</h2>
        <select
          className="input w-auto"
          value={language}
          onChange={(e) => switchLanguage(e.target.value as LanguageKey)}
        >
          {(Object.keys(LANGUAGES) as LanguageKey[]).map((key) => (
            <option key={key} value={key}>
              {LANGUAGES[key].label}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-md border border-bd">
        <CodeMirror
          value={code}
          height="380px"
          theme={darkTheme ? "dark" : "light"}
          extensions={CM_EXTENSIONS[language]}
          onChange={updateCode}
          basicSetup={{ tabSize: 4 }}
        />
      </div>
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

      {error && <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          className={`pill ${showCustom ? "pill-active" : ""}`}
          onClick={() => setShowCustom((v) => !v)}
        >
          自訂輸入
        </button>
        <div className="flex gap-3">
          <button
            className="btn-secondary"
            onClick={runTest}
            disabled={running || submitting}
          >
            {running ? "執行中…" : "測試執行"}
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={running || submitting}
          >
            {submitting ? "送出中…" : "送出解答"}
          </button>
        </div>
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
    </div>
  );
}
