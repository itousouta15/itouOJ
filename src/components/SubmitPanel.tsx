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
      {error && <p className="mt-2 text-sm text-[#ff6b6b]">{error}</p>}
      <div className="mt-3 flex justify-end">
        <button className="btn-primary" onClick={submit} disabled={submitting}>
          {submitting ? "提交中…" : "提交程式碼"}
        </button>
      </div>
    </div>
  );
}
