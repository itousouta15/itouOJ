"use client";

import { useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";

// 識別題的程式碼區塊（練習頁、詳情頁、比賽題目頁共用）。依題目分類
// （C / Python）上色、唯讀、附行號，行號欄固定在左緣，題目提到
// 「第 n 行」時不用自己數。
function extensionsFor(language: string | null | undefined): Extension[] {
  if (language === "Python") return [python()];
  if (language === "C") return [cpp()];
  return [];
}

export default function CodeBlock({
  code,
  language,
  maxHeight = "max-h-96",
}: {
  code: string;
  language?: string | null;
  maxHeight?: string;
}) {
  const [darkTheme, setDarkTheme] = useState(true);

  // 跟著網站的亮暗主題（<html data-theme>）切換，同 SubmitPanel
  useEffect(() => {
    const el = document.documentElement;
    const update = () => setDarkTheme(el.getAttribute("data-theme") !== "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const extensions = useMemo(() => extensionsFor(language), [language]);

  if (!code || code.trim() === "") return null;
  const normalized = code.replace(/\r\n?/g, "\n");

  return (
    <div className={`code-block ${maxHeight} overflow-auto rounded-lg bg-inset`}>
      <CodeMirror
        value={normalized}
        theme={darkTheme ? "dark" : "light"}
        extensions={extensions}
        editable={false}
        basicSetup={{
          tabSize: 4,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          autocompletion: false,
          closeBrackets: false,
          highlightActiveLine: false,
          highlightActiveLineGutter: false,
          highlightSelectionMatches: false,
          history: false,
        }}
      />
    </div>
  );
}
