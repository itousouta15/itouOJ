"use client";

import { memo, useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import {
  acceptCompletion,
  clearSnippet,
  nextSnippetField,
  prevSnippetField,
  snippetKeymap,
} from "@codemirror/autocomplete";
import { Prec, type Extension } from "@codemirror/state";
import { EditorView, keymap, tooltips } from "@codemirror/view";
import type { LanguageKey } from "@/lib/languages";
import { loadEditorLanguage } from "@/lib/editorLanguages";

const BASIC_SETUP = { tabSize: 4 };
const EMPTY_EXTENSIONS: Extension[] = [];
const COMPLETION_KEYS = Prec.highest(keymap.of([{ key: "Tab", run: acceptCompletion }]));
const SNIPPET_KEYS = snippetKeymap.of([
  { key: "Tab", run: (view) => acceptCompletion(view) || nextSnippetField(view), shift: prevSnippetField },
  { key: "Escape", run: clearSnippet },
]);

interface CodeEditorProps {
  code: string;
  language: LanguageKey;
  fontSize: number;
  onChange: (code: string) => void;
  onCreateEditor: (view: EditorView) => void;
  onFocus: () => void;
  onWheel: (event: WheelEvent) => void;
  onFormat: () => Promise<void>;
}

function CodeEditor({
  code, language, fontSize, onChange, onCreateEditor, onFocus, onWheel, onFormat,
}: CodeEditorProps) {
  const [loaded, setLoaded] = useState<{ language: LanguageKey; extensions: Extension[] } | null>(null);
  const [failed, setFailed] = useState<LanguageKey | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    loadEditorLanguage(language).then((extensions) => {
      if (!disposed) {
        setLoaded({ language, extensions });
        setFailed(null);
      }
    }).catch(() => {
      if (!disposed) setFailed(language);
    });
    return () => { disposed = true; };
  }, [language, retry]);

  const languageExtensions = loaded?.language === language ? loaded.extensions : EMPTY_EXTENSIONS;
  const extensions = useMemo(() => [
    ...languageExtensions,
    COMPLETION_KEYS,
    SNIPPET_KEYS,
    keymap.of([{ key: "Shift-Alt-f", run: () => { void onFormat(); return true; } }]),
    EditorView.domEventHandlers({ wheel: (event) => { onWheel(event); return event.defaultPrevented; } }),
    ...(typeof document !== "undefined" ? [tooltips({ parent: document.body })] : []),
    EditorView.theme({ "&": { fontSize: `${fontSize}px` } }),
  ], [languageExtensions, fontSize, onFormat, onWheel]);

  return (
    <>
      {failed === language && (
        <p className="px-3 py-2 text-xs text-dim" role="status">
          語言支援載入失敗，仍可編輯程式碼。
          <button type="button" className="ml-2 underline" onClick={() => setRetry((value) => value + 1)}>重試</button>
        </p>
      )}
      <CodeMirror
        value={code}
        theme="dark"
        extensions={extensions}
        basicSetup={BASIC_SETUP}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        onFocus={onFocus}
      />
    </>
  );
}

export default memo(CodeEditor);
