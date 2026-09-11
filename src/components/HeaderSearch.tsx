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

// 搜尋實作題與標籤；頁內模式只改呈現方式，仍共用同一套建議與鍵盤操作。
export default function HeaderSearch({
  variant = "header",
}: {
  variant?: "header" | "page";
}) {
  const isPageSearch = variant === "page";
  const [open, setOpen] = useState(isPageSearch);
  const [suggestionsVisible, setSuggestionsVisible] = useState(isPageSearch);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [data, setData] = useState<SuggestionData>(EMPTY_DATA);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = useCallback(() => {
    setOpen(isPageSearch);
    setSuggestionsVisible(isPageSearch);
    setInput("");
    setTags([]);
    setData(EMPTY_DATA);
    setActiveIndex(0);
    setLoading(false);
  }, [isPageSearch]);

  const dismissSuggestions = useCallback(() => {
    if (isPageSearch) {
      setSuggestionsVisible(false);
      return;
    }
    reset();
  }, [isPageSearch, reset]);

  useEffect(() => {
    if (!open) return;
    if (!isPageSearch) inputRef.current?.focus();

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") dismissSuggestions();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        dismissSuggestions();
      }
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dismissSuggestions, isPageSearch, open]);

  useEffect(() => {
    const searchActive = open && (!isPageSearch || suggestionsVisible);
    if (!searchActive) return;

    const text = input.trim();
    if (!text && tags.length === 0) return;

    const key = `${text}|${tags.join(",")}`;
    let aborted = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (text) params.set("q", text);
        if (tags.length) params.set("tags", tags.join(","));
        const response = await fetch(`/api/search/suggest?${params}`, {
          signal: controller.signal,
        });
        const json = await response.json();
        if (!aborted) {
          setData({
            key,
            tags: json.tags ?? [],
            problems: json.problems ?? [],
          });
          setActiveIndex(0);
        }
      } catch (error) {
        if (!aborted && (error as Error).name !== "AbortError") {
          setData({ key, tags: [], problems: [] });
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }, 160);

    return () => {
      aborted = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [input, isPageSearch, open, suggestionsVisible, tags]);

  function addTag(name: string) {
    setTags((previous) => (previous.includes(name) ? previous : [...previous, name]));
    setInput("");
    setSuggestionsVisible(true);
    setActiveIndex(0);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    setTags((previous) => previous.filter((tag) => tag !== name));
    setSuggestionsVisible(true);
    inputRef.current?.focus();
  }

  function go(problem: Suggestion) {
    reset();
    router.push(`/problems/${problem.order}`);
  }

  const text = input.trim();
  const hasQuery = input.length > 0 || tags.length > 0;
  const listKey = `${text}|${tags.join(",")}`;
  const current = data.key === listKey ? data : EMPTY_DATA;
  const tagItems = current.tags;
  const problemItems = current.problems;
  const flatCount = tagItems.length + problemItems.length;
  const showList =
    open &&
    (!isPageSearch || suggestionsVisible) &&
    (text.length > 0 || tags.length > 0);
  const pending = loading || (showList && data.key !== listKey);

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        flatCount === 0 ? 0 : Math.min(index + 1, flatCount - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex < tagItems.length) {
        const tag = tagItems[activeIndex];
        if (tag) addTag(tag);
      } else {
        const problem = problemItems[activeIndex - tagItems.length];
        if (problem) go(problem);
      }
    } else if (event.key === "Backspace" && text === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <form
      ref={rootRef}
      className={`header-search${open ? " is-open" : ""}${
        isPageSearch ? " header-search--page" : ""
      }`}
      onSubmit={(event) => event.preventDefault()}
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
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setSuggestionsVisible(true);
          }}
          onFocus={() => setSuggestionsVisible(true)}
          onKeyDown={onKeyDown}
          placeholder={tags.length > 0 ? "" : "搜尋實作題或標籤…"}
          className="header-search-input"
          tabIndex={open ? 0 : -1}
          role="combobox"
          aria-label="搜尋實作題或標籤"
          aria-expanded={isPageSearch ? showList : open}
          aria-controls="problem-search-suggestions"
          aria-haspopup="listbox"
          autoComplete="off"
        />
        <button
          type="button"
          className="header-search-icon"
          onClick={() => {
            if (isPageSearch) {
              if (hasQuery) reset();
              setSuggestionsVisible(true);
              inputRef.current?.focus();
              return;
            }
            if (open) reset();
            else setOpen(true);
          }}
          aria-label={
            isPageSearch && hasQuery ? "清除搜尋" : "搜尋實作題或標籤"
          }
          title={isPageSearch && hasQuery ? "清除搜尋" : "搜尋"}
        >
          {(isPageSearch ? hasQuery : open) ? (
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
        <div
          id="problem-search-suggestions"
          className="header-search-list"
          role="listbox"
        >
          {flatCount === 0 ? (
            <div className="header-search-empty">
              {pending ? "搜尋中…" : "沒有符合的題目"}
            </div>
          ) : (
            <>
              {tagItems.length > 0 && (
                <div className="header-search-group">
                  <div className="header-search-group-head">標籤</div>
                  {tagItems.map((name, index) => (
                    <button
                      key={`tag-${name}`}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      className={`header-search-item${
                        index === activeIndex ? " active" : ""
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
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
                  {problemItems.map((problem, offset) => {
                    const index = tagItems.length + offset;
                    return (
                      <button
                        key={`problem-${problem.id}`}
                        type="button"
                        role="option"
                        aria-selected={index === activeIndex}
                        className={`header-search-item${
                          index === activeIndex ? " active" : ""
                        }`}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(problem)}
                      >
                        <span className="header-search-item-title">
                          {problem.title}
                        </span>
                        <DifficultyBadge difficulty={problem.difficulty} />
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
