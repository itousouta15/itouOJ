"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import VerdictBadge from "@/components/VerdictBadge";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";

interface SubmissionData {
  id: number;
  username: string;
  problem: { id: number; title: string };
  language: string;
  status: string;
  timeMs: number | null;
  memoryKb: number | null;
  createdAt: string;
  results: {
    order: number;
    verdict: string;
    timeMs: number | null;
    memoryKb: number | null;
  }[];
  code: string | null;
  compileError: string | null;
}

const TERMINAL = ["AC", "WA", "TLE", "MLE", "RE", "CE", "IE"];

export default function SubmissionDetail({ id }: { id: number }) {
  const [data, setData] = useState<SubmissionData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/submissions/${id}`, {
          cache: "no-store",
        });
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const json: SubmissionData = await res.json();
        if (cancelled) return;
        setData(json);
        if (!TERMINAL.includes(json.status)) {
          timer.current = setTimeout(poll, 1200);
        }
      } catch {
        if (!cancelled) timer.current = setTimeout(poll, 3000);
      }
    }
    poll();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [id]);

  if (notFound) {
    return <p className="text-dim">找不到這筆提交。</p>;
  }
  if (!data) {
    return <p className="animate-pulse text-mute">載入中…</p>;
  }

  const langLabel = isLanguageKey(data.language)
    ? LANGUAGES[data.language].label
    : data.language;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-title">提交 #{data.id}</h1>
        <VerdictBadge status={data.status} />
      </div>

      <div className="card p-4 text-sm">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="text-dim">題目：</span>
            <Link
              href={`/problems/${data.problem.id}`}
              className="text-blue hover:underline"
            >
              {data.problem.title}
            </Link>
          </p>
          <p>
            <span className="text-dim">使用者：</span>
            {data.username}
          </p>
          <p>
            <span className="text-dim">語言：</span>
            {langLabel}
          </p>
          <p>
            <span className="text-dim">耗時 / 記憶體：</span>
            {data.timeMs != null ? `${data.timeMs} ms` : "—"} /{" "}
            {data.memoryKb != null
              ? `${Math.round(data.memoryKb / 1024)} MB`
              : "—"}
          </p>
        </div>
      </div>

      {data.compileError && (
        <div className="card border-[rgba(237,66,69,0.3)] p-4">
          <p className="mb-2 text-sm font-semibold text-[#ff6b6b]">
            {data.status === "CE" ? "編譯錯誤訊息" : "錯誤訊息"}
          </p>
          <pre className="overflow-x-auto rounded bg-inset p-3 font-mono text-xs whitespace-pre-wrap text-[#ff8a8a]">
            {data.compileError}
          </pre>
        </div>
      )}

      {data.results.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head w-24">測資</th>
                <th className="table-head">結果</th>
                <th className="table-head w-28 text-right">時間</th>
                <th className="table-head w-28 text-right">記憶體</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.order}>
                  <td className="table-cell text-dim">#{r.order}</td>
                  <td className="table-cell">
                    <VerdictBadge status={r.verdict} />
                  </td>
                  <td className="table-cell text-right text-dim">
                    {r.timeMs != null ? `${r.timeMs} ms` : "—"}
                  </td>
                  <td className="table-cell text-right text-dim">
                    {r.memoryKb != null
                      ? `${(r.memoryKb / 1024).toFixed(1)} MB`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.code && (
        <div>
          <h2 className="mb-2 section-title">程式碼</h2>
          <pre className="overflow-x-auto rounded-lg bg-inset p-4 font-mono text-[13px] leading-6 text-tx">
            {data.code}
          </pre>
        </div>
      )}
    </div>
  );
}
