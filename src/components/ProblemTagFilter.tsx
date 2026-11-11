"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

export default function ProblemTagFilter({
  selectedTag,
  clearHref,
  options,
}: {
  selectedTag?: string;
  clearHref: string;
  options: { name: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const term = search.trim().toLowerCase();
  const matches = open
    ? options.filter(({ name }) => name.toLowerCase().includes(term))
    : [];

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
                href={clearHref}
                prefetch={false}
                onClick={close}
                aria-current={!selectedTag ? "true" : undefined}
                className={`pill block ${!selectedTag ? "pill-active" : ""}`}
              >
                全部標籤
              </Link>
            </li>
            {matches.map(({ name, href }) => (
              <li key={name}>
                <Link
                  href={href}
                  prefetch={false}
                  onClick={close}
                  aria-current={selectedTag === name ? "true" : undefined}
                  className={`pill block break-words ${selectedTag === name ? "pill-active" : ""}`}
                >
                  {name}
                </Link>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-2 py-1 text-dim">找不到符合的標籤</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
