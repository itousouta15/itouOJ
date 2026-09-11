"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import DifficultyBadge from "@/components/DifficultyBadge";

interface Suggestion {
  id: number;
  order: number;
  title: string;
  difficulty: string;
}

interface SuggestionData {
  key: string;
  tags: string[];
  problems: Suggestion[];
}

const EMPTY_DATA: SuggestionData = { key: "", tags: [], problems: [] };

// Header 搜尋：只搜實作題。輸入文字會同時比對「標籤 / 題目」，標籤可點成 chip
// 當篩選條件（多個標籤取交集），題目直接跳題目頁。Esc 或點別處收合。
export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [data, setData] = useState<SuggestionData>(EMPTY_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setInput("");
    setTags([]);
    setData(EMPTY_DATA);
    setActiveIndex(0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  // 輸入或已選標籤變動時 debounce 打推薦 API；舊請求 abort。
  useEffect(() => {
    if (!open) return;
    const text = input.trim();
    if (!text && tags.length === 0) return;
    const key = `${text}|${tags.join(",")}`;
    let aborted = false;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (text) params.set("q", text);
        if (tags.length) params.set("tags", tags.join(","));
        const res = await fetch(`/api/search/suggest?${params}`, {
          signal: ctrl.signal,
        });
        const json = await res.json();
        if (!aborted) {
          setData({
            key,
            tags: json.tags ?? [],
            problems: json.problems ?? [],
          });
          setActiveIndex(0);
        }
      } catch (err) {
        if (!aborted && (err as Error).name !== "AbortError") {
          setData({ key, tags: [], problems: [] });
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }, 160);
    return () => {
      aborted = true;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [input, tags, open]);

  function addTag(name: string) {
    setTags((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setInput("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
    inputRef.current?.focus();
  }

  function go(p: Suggestion) {
    close();
    router.push(`/problems/${p.order}`);
  }

  const text = input.trim();
  const listKey = `${text}|${tags.join(",")}`;
  const current = data.key === listKey ? data : EMPTY_DATA;
  const tagItems = current.tags;
  const problemItems = current.problems;
  const flatCount = tagItems.length + problemItems.length;
  const showList = open && (text.length > 0 || tags.length > 0);
  const pending = loading || (showList && data.key !== listKey);

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < tagItems.length) {
        addTag(tagItems[activeIndex]);
      } else {
        const p = problemItems[activeIndex - tagItems.length];
        if (p) go(p);
      }
    } else if (e.key === "Backspace" && text === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <form
      ref={rootRef}
      className={`header-search${open ? " is-open" : ""}`}
      onSubmit={(e) => e.preventDefault()}
      role="search"
    >
      <div className="header-search-pill">
        {tags.length > 0 && (
          <div className="header-search-tokens">
            {tags.map((name) => (
              <span key={name} className="header-search-token">
                {name}
                <button
                  type="button"
                  onClick={() => removeTag(name)}
                  aria-label={`移除標籤 ${name}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={tags.length > 0 ? "" : "搜尋實作題或標籤…"}
          className="header-search-input"
          tabIndex={open ? 0 : -1}
          aria-label="搜尋實作題或標籤"
          autoComplete="off"
        />
        <button
          type="button"
          className="header-search-icon"
          onClick={() => (open ? close() : setOpen(true))}
          aria-label="搜尋"
          title="搜尋"
          aria-expanded={open}
        >
          {open ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          )}
        </button>
      </div>

      {showList && (
        <div className="header-search-list" role="listbox">
          {flatCount === 0 ? (
            <div className="header-search-empty">
              {pending ? "搜尋中…" : "沒有符合的題目"}
            </div>
          ) : (
            <>
              {tagItems.length > 0 && (
                <div className="header-search-group">
                  <div className="header-search-group-head">標籤</div>
                  {tagItems.map((name, i) => (
                    <button
                      key={`tag-${name}`}
                      type="button"
                      role="option"
                      aria-selected={i === activeIndex}
                      className={`header-search-item${
                        i === activeIndex ? " active" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => addTag(name)}
                    >
                      <span className="header-search-tag-glyph">#</span>
                      <span className="header-search-item-title">{name}</span>
                    </button>
                  ))}
                </div>
              )}
              {problemItems.length > 0 && (
                <div className="header-search-group">
                  <div className="header-search-group-head">題目</div>
                  {problemItems.map((p, j) => {
                    const i = tagItems.length + j;
                    return (
                      <button
                        key={`p-${p.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === activeIndex}
                        className={`header-search-item${
                          i === activeIndex ? " active" : ""
                        }`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => go(p)}
                      >
                        <span className="header-search-item-title">
                          {p.title}
                        </span>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </form>
  );
}