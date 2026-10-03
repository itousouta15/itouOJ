import type { LanguageSupport } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import type { LanguageKey } from "@/lib/languages";
import { DOCUMENT_WORD_COMPLETIONS, EDITOR_COMPLETIONS } from "@/lib/editorCompletions";

const languages = new Map<LanguageKey, Promise<Extension[]>>();

export function loadEditorLanguage(language: LanguageKey): Promise<Extension[]> {
  const cached = languages.get(language);
  if (cached) return cached;

  const loading = (async () => {
    let support: LanguageSupport;
    switch (language) {
      case "c":
      case "cpp":
        support = (await import("@codemirror/lang-cpp")).cpp();
        break;
      case "python":
        support = (await import("@codemirror/lang-python")).python();
        break;
      case "javascript":
        support = (await import("@codemirror/lang-javascript")).javascript();
        break;
    }
    return [
      support,
      support.language.data.of({ autocomplete: EDITOR_COMPLETIONS[language] }),
      ...(language === "c" || language === "cpp"
        ? [support.language.data.of({ autocomplete: DOCUMENT_WORD_COMPLETIONS })]
        : []),
    ];
  })().catch((error) => {
    languages.delete(language);
    throw error;
  });
  languages.set(language, loading);
  return loading;
}
