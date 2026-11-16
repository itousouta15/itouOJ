"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { problemsHref } from "@/lib/problemsHref";

// 標籤有數千筆，不隨頁面一次送出；開啟選單與輸入時才向 /api/problems/tags 查詢（每次最多 30 筆）。
export default function ProblemTagFilter({
  selectedTag,
  query,
  sort,
}: {
  selectedTag?: string;
  query: string;
  sort: "order" | "difficulty";
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ key: string; tags: string[] } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const term = search.trim();

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/problems/tags?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("bad response");
        const json = (await res.json()) as { tags?: string[] };
        setResults({ key: term, tags: json.tags ?? [] });
        setFailedKey(null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setFailedKey(term);
      }
    }, term ? 200 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, term]);

  const loading = open && results?.key !== term && failedKey !== term;
  const matches = results?.key === term ? results.tags : (results?.tags ?? []);

  function close() {
    setOpen(false);
    setSearch("");
    trigger.current?.focus();
  }

  return (
    <div
      className="relative min-w-0 max-w-full"
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`pill flex max-w-full items-center gap-2 ${selectedTag ? "pill-active" : ""}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="truncate">標籤：{selectedTag || "全部"}</span>
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-full z-20 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-bd bg-panel p-2 shadow-lg"
        >
          <input
            type="search"
            className="input mb-2 w-full"
            placeholder="搜尋標籤"
            aria-label="搜尋標籤"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            <li>
              <Link
                href={problemsHref({ query, sort })}
                prefetch={false}
                onClick={close}
                aria-current={!selectedTag ? "true" : undefined}
                className={`pill block ${!selectedTag ? "pill-active" : ""}`}
              >
                全部標籤
              </Link>
            </li>
            {matches.map((name) => (
              <li key={name}>
                <Link
                  href={problemsHref({ query, tag: name, sort })}
                  prefetch={false}
                  onClick={close}
                  aria-current={selectedTag === name ? "true" : undefined}
                  className={`pill block break-words ${selectedTag === name ? "pill-active" : ""}`}
                >
                  {name}
                </Link>
              </li>
            ))}
            {loading && matches.length === 0 && (
              <li className="px-2 py-1 text-dim">載入中…</li>
            )}
            {failedKey === term && (
              <li className="px-2 py-1 text-dim">標籤載入失敗，請稍後再試</li>
            )}
            {!loading && failedKey !== term && matches.length === 0 && (
              <li className="px-2 py-1 text-dim">找不到符合的標籤</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
