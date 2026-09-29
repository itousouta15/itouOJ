"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LanguageKey } from "@/lib/languages";

type RemoteDraft = { code: string; revision: number } | null;
type LocalDraft = { code: string; revision: number | null; dirty: boolean };
type Conflict = { language: LanguageKey; remote: RemoteDraft };

function localKey(userId: string, problemId: number, language: LanguageKey) {
  return `oj-draft-v2-${userId}-${problemId}-${language}`;
}

function readLocal(key: string): LocalDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || !("code" in value) ||
        !("revision" in value) || !("dirty" in value)) return null;
    const draft = value as LocalDraft;
    return typeof draft.code === "string" &&
      (draft.revision === null || Number.isInteger(draft.revision)) &&
      typeof draft.dirty === "boolean" ? draft : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, draft: LocalDraft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function useSyncedDraft({
  userId, problemId, contestId, defaultLanguage, languageOptions, templates,
}: {
  userId: string;
  problemId: number;
  contestId?: number;
  defaultLanguage: LanguageKey;
  languageOptions: LanguageKey[];
  templates: Record<LanguageKey, string>;
}) {
  const [language, setLanguage] = useState(defaultLanguage);
  const [code, setCode] = useState(templates[defaultLanguage]);
  const [status, setStatus] = useState("載入草稿中…");
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const languageRef = useRef(language);
  const conflictRef = useRef<Conflict | null>(null);
  const timers = useRef<Partial<Record<LanguageKey, ReturnType<typeof setTimeout>>>>({});
  const saving = useRef<Partial<Record<LanguageKey, boolean>>>({});
  const saveRef = useRef<(lang: LanguageKey) => void>(() => {});
  const loadSequence = useRef(0);
  const keyFor = useCallback((lang: LanguageKey) => localKey(userId, problemId, lang), [userId, problemId]);
  const url = useCallback((lang: LanguageKey) => {
    const params = new URLSearchParams({ problemId: String(problemId), language: lang });
    if (contestId !== undefined) params.set("contestId", String(contestId));
    return `/api/drafts?${params}`;
  }, [problemId, contestId]);

  const showConflict = useCallback((lang: LanguageKey, remote: RemoteDraft) => {
    if (languageRef.current !== lang) return;
    const next = { language: lang, remote };
    conflictRef.current = next;
    setConflict(next);
    setStatus("草稿版本衝突，請選擇要保留的版本");
  }, []);

  const scheduleSave = useCallback((lang: LanguageKey) => {
    clearTimeout(timers.current[lang]);
    timers.current[lang] = setTimeout(() => saveRef.current(lang), 800);
  }, []);

  const saveNow = useCallback(async (lang: LanguageKey) => {
    const key = keyFor(lang);
    const draft = readLocal(key);
    if (!draft?.dirty || saving.current[lang] || conflictRef.current?.language === lang) return;
    saving.current[lang] = true;
    if (languageRef.current === lang) setStatus("同步中…");
    try {
      const response = await fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          problemId, contestId, language: lang, code: draft.code, revision: draft.revision,
        }),
      });
      if (!response.ok && response.status !== 409) throw new Error("sync failed");
      const data = (await response.json()) as { draft: RemoteDraft };
      const current = readLocal(key);
      if (!current) return;
      if (response.status === 409) {
        if (data.draft?.code === current.code) {
          writeLocal(key, { ...current, revision: data.draft.revision, dirty: false });
          if (languageRef.current === lang) setStatus("已同步至帳號");
        } else {
          showConflict(lang, data.draft);
        }
        return;
      }
      const unchanged = current.code === draft.code && current.revision === draft.revision;
      writeLocal(key, {
        ...current, revision: data.draft?.revision ?? null, dirty: !unchanged,
      });
      if (languageRef.current === lang) setStatus(unchanged ? "已同步至帳號" : "尚有變更待同步");
      if (!unchanged) scheduleSave(lang);
    } catch {
      // 網路中斷時草稿仍保留在此裝置；下次連線或開啟頁面再同步。
      if (languageRef.current === lang) setStatus("僅存於此裝置，連線後重試");
    } finally {
      saving.current[lang] = false;
    }
  }, [problemId, contestId, keyFor, showConflict, scheduleSave]);

  useEffect(() => { saveRef.current = (lang) => { void saveNow(lang); }; }, [saveNow]);

  const load = useCallback(async (lang: LanguageKey) => {
    const key = keyFor(lang);
    if (languageRef.current !== lang) return;
    const sequence = ++loadSequence.current;
    const initial = readLocal(key);
    const oldDraft = initial ? null : localStorage.getItem(`oj-draft-${problemId}-${lang}`);
    setCode(initial?.code ?? oldDraft ?? templates[lang]);
    setStatus(initial?.dirty ? "尚有變更待同步" : "載入雲端草稿中…");
    try {
      const response = await fetch(url(lang), { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");
      const { draft: remote } = (await response.json()) as { draft: RemoteDraft };
      if (languageRef.current !== lang || sequence !== loadSequence.current) return;
      const local = readLocal(key); // 請求期間可能已輸入新內容，不能使用請求前的快照。
      // 先前的讀取請求可能在剛完成的寫入之後才返回，不能倒退到舊版本。
      if (local?.revision != null && remote && local.revision > remote.revision) {
        setCode(local.code);
        setStatus(local.dirty ? "尚有變更待同步" : "已同步至帳號");
        if (local.dirty) scheduleSave(lang);
        return;
      }
      const legacy = local === null ? localStorage.getItem(`oj-draft-${problemId}-${lang}`) : null;
      if (legacy !== null && legacy !== templates[lang] && legacy !== remote?.code) {
        setCode(legacy);
        showConflict(lang, remote);
      } else if (local && remote && local.code === templates[lang]) {
        // 本機只有預設範本時不與帳號草稿衝突，也不要把範本同步上去覆蓋程式。
        writeLocal(key, { code: remote.code, revision: remote.revision, dirty: false });
        setCode(remote.code);
        setStatus("已同步至帳號");
      } else if (!local && remote) {
        writeLocal(key, { code: remote.code, revision: remote.revision, dirty: false });
        setCode(remote.code);
        setStatus("已同步至帳號");
      } else if (!local) {
        setStatus("草稿將自動儲存並同步");
      } else if (local.dirty) {
        setCode(local.code);
        if (local.revision !== remote?.revision && !(local.revision === null && !remote)) {
          if (local.code === remote?.code && remote) {
            writeLocal(key, { ...local, revision: remote.revision, dirty: false });
            setStatus("已同步至帳號");
          } else {
            showConflict(lang, remote);
          }
        } else {
          setStatus("尚有變更待同步");
          scheduleSave(lang);
        }
      } else if (remote && (local.revision !== remote.revision || local.code !== remote.code)) {
        writeLocal(key, { code: remote.code, revision: remote.revision, dirty: false });
        setCode(remote.code);
        setStatus("已同步至帳號");
      } else if (!remote && local.revision !== null) {
        writeLocal(key, { ...local, revision: null, dirty: true });
        scheduleSave(lang);
      } else {
        setStatus("已同步至帳號");
      }
    } catch {
      if (languageRef.current === lang && sequence === loadSequence.current) {
        setStatus("僅存於此裝置，連線後重試");
      }
    }
  }, [keyFor, problemId, templates, scheduleSave, showConflict, url]);

  useEffect(() => {
    const saved = localStorage.getItem("oj-language") as LanguageKey | null;
    if (saved && languageOptions.includes(saved)) {
      // 在 hydration 後讀取瀏覽器上次使用的語言。
      const frame = requestAnimationFrame(() => switchLanguage(saved));
      return () => cancelAnimationFrame(frame);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    languageRef.current = language;
    const frame = requestAnimationFrame(() => { void load(language); });
    return () => cancelAnimationFrame(frame);
  }, [language, load]);

  useEffect(() => {
    const retry = () => {
      const current = languageRef.current;
      void load(current);
      // 離線時切換過語言的草稿，也要在復網時補傳。
      for (const lang of languageOptions) {
        if (lang !== current && readLocal(keyFor(lang))?.dirty) void saveNow(lang);
      }
    };
    window.addEventListener("online", retry);
    window.addEventListener("focus", retry);
    const onVisible = () => { if (!document.hidden) retry(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", retry);
      window.removeEventListener("focus", retry);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load, keyFor, languageOptions, saveNow]);

  useEffect(() => {
    const activeTimers = timers.current;
    const sequence = loadSequence;
    return () => {
      sequence.current++;
      for (const timer of Object.values(activeTimers)) clearTimeout(timer);
    };
  }, []);

  function switchLanguage(lang: LanguageKey) {
    loadSequence.current++;
    languageRef.current = lang;
    conflictRef.current = null;
    setConflict(null);
    localStorage.setItem("oj-language", lang);
    setLanguage(lang);
    setCode(readLocal(keyFor(lang))?.code ?? templates[lang]);
  }

  function updateCode(value: string) {
    const lang = languageRef.current;
    setCode(value);
    const key = keyFor(lang);
    const previous = readLocal(key);
    if (!writeLocal(key, { code: value, revision: previous?.revision ?? null, dirty: true })) {
      setStatus("裝置儲存空間不足，請備份程式碼");
      return;
    }
    if (conflictRef.current?.language !== lang) {
      setStatus("尚有變更待同步");
      scheduleSave(lang);
    }
  }

  function keepLocal() {
    if (!conflict) return;
    const key = keyFor(conflict.language);
    const current = readLocal(key);
    const chosen = current?.code ?? code; // 舊版草稿尚未寫入帳號專屬的本機鍵。
    writeLocal(key, { code: chosen, revision: conflict.remote?.revision ?? null, dirty: true });
    setCode(chosen);
    conflictRef.current = null;
    setConflict(null);
    scheduleSave(conflict.language);
  }

  function keepCloud() {
    if (!conflict) return;
    const remote = conflict.remote;
    const chosen = remote?.code ?? templates[conflict.language];
    writeLocal(keyFor(conflict.language), { code: chosen, revision: remote?.revision ?? null, dirty: false });
    setCode(chosen);
    conflictRef.current = null;
    setConflict(null);
    setStatus("已同步至帳號");
  }

  return { language, code, status, conflict, switchLanguage, updateCode, keepLocal, keepCloud };
}
