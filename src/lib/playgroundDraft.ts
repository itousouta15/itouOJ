import { LANGUAGE_KEYS, type LanguageKey } from "@/lib/languages";
import { PLAYGROUND_TEMPLATES } from "@/lib/playground";
import { ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE } from "@/lib/itoulangTemplates";

export interface PlaygroundDraft {
  version: 3;
  language: LanguageKey;
  codes: Record<LanguageKey, string>;
  input: string;
}

export function createPlaygroundDraft(): PlaygroundDraft {
  return { version: 3, language: "cpp", codes: { ...PLAYGROUND_TEMPLATES }, input: "" };
}

export function restorePlaygroundDraft(value: unknown): { draft: PlaygroundDraft; templateUpgraded: boolean } {
  const draft = createPlaygroundDraft();
  if (!value || typeof value !== "object" || Array.isArray(value)) return { draft, templateUpgraded: false };
  const saved = value as { version?: unknown; language?: unknown; codes?: unknown; input?: unknown };
  if (typeof saved.language === "string" && LANGUAGE_KEYS.includes(saved.language as LanguageKey)) {
    draft.language = saved.language as LanguageKey;
  }
  if (typeof saved.input === "string") draft.input = saved.input;
  if (saved.codes && typeof saved.codes === "object" && !Array.isArray(saved.codes)) {
    const codes = saved.codes as Record<string, unknown>;
    for (const language of LANGUAGE_KEYS) {
      if (typeof codes[language] === "string") draft.codes[language] = codes[language];
    }
  }

  // v1 saved all language templates with the draft, including an untouched
  // itouLang 0.2 Hello World. Migrate only that exact default, once. A v2 user
  // intentionally typing the same valid legacy program must keep their code.
  const legacy = saved.version === undefined || saved.version === 1;
  const normalized = draft.codes.itoulang.replace(/\r\n/g, "\n").trim();
  const previousBrand = (legacy || saved.version === 2) && normalized === ITOULANG_PREVIOUS_PLAYGROUND_TEMPLATE.trim();
  const templateUpgraded = previousBrand || (legacy && normalized === '喵("Hello, world!");');
  if (templateUpgraded) draft.codes.itoulang = PLAYGROUND_TEMPLATES.itoulang;
  return { draft, templateUpgraded };
}
