"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import VerdictBadge from "@/components/VerdictBadge";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";

interface SubmissionData {
  id: number;
  username: string;
  problem: {
    id: number;
    order: number;
    title: string;
    subtasks: { order: number; points: number }[];
  };
  language: string;
  status: string;
  score: number | null;
  timeMs: number | null;
  memoryKb: number | null;
  createdAt: string;
  results: {
    order: number;
    subtaskOrder: number | null;
    verdict: string;
    timeMs: number | null;
    memoryKb: number | null;
    input: string | null;
    expectedOutput: string | null;
    actualOutput: string | null;
  }[];
  code: string | null;
  compileError: string | null;
}

interface HiddenSubmission {
  id: number;
  contestId: number;
  hidden: true;
}

const TERMINAL = ["AC", "WA", "TLE", "MLE", "RE", "CE", "IE"];

function TestCasePanel({
  input,
  expectedOutput,
  actualOutput,
}: {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
}) {
  return (
    <div className="grid gap-3 p-4 text-xs sm:grid-cols-3">
      <div>
        <p className="mb-1 text-dim">輸入</p>
        <pre className="overflow-x-auto rounded bg-inset p-2 font-mono whitespace-pre-wrap">
          {input}
        </pre>
      </div>
      <div>
        <p className="mb-1 text-dim">預期輸出</p>
        <pre className="overflow-x-auto rounded bg-inset p-2 font-mono whitespace-pre-wrap">
          {expectedOutput}
        </pre>
      </div>
      <div>
        <p className="mb-1 text-dim">你的輸出</p>
        <pre className="overflow-x-auto rounded bg-inset p-2 font-mono whitespace-pre-wrap">
          {actualOutput || "（無輸出）"}
        </pre>
      </div>
    </div>
  );
}

export default function SubmissionDetail({ id }: { id: number }) {
  const [data, setData] = useState<SubmissionData | null>(null);
  const [hidden, setHidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
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
        const json: SubmissionData | HiddenSubmission = await res.json();
        if (cancelled) return;
        if ("hidden" in json) {
          setHidden(true);
          return;
        }
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
  if (hidden) {
    return (
      <p className="text-dim">
        這筆提交屬於進行中的比賽，結果將於比賽結束公開成績後顯示。
      </p>
    );
  }
  if (!data) {
    return <p className="animate-pulse text-mute">載入中…</p>;
  }

  const langLabel = isLanguageKey(data.language)
    ? LANGUAGES[data.language].label
    : data.language;

  const hasSubtasks = data.problem.subtasks.length > 0;
  const maxScore = data.problem.subtasks.reduce((s, x) => s + x.points, 0);
  const subtaskGroups = hasSubtasks
    ? data.problem.subtasks.map((s) => ({
        ...s,
        results: data.results.filter((r) => r.subtaskOrder === s.order),
      }))
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="page-title">提交 #{data.id}</h1>
        <VerdictBadge status={data.status} />
        {hasSubtasks && data.score != null && (
          <span className="mono text-sm text-dim">
            得分 {data.score} / {maxScore}
          </span>
        )}
      </div>

      <div className="card p-4 text-sm">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          <p>
            <span className="text-dim">題目：</span>
            <Link
              href={`/problems/${data.problem.order}`}
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

      {hasSubtasks && subtaskGroups.some((g) => g.results.length > 0) && (
        <div className="space-y-4">
          {subtaskGroups.map((g) => {
            if (g.results.length === 0) return null;
            const passed = g.results.every((r) => r.verdict === "AC");
            return (
              <div key={g.order} className="card overflow-x-auto">
                <div className="flex items-center justify-between border-b border-bd px-4 py-2">
                  <p className="text-sm font-semibold">
                    子題 {g.order}（{g.points} 分）
                  </p>
                  <span
                    className={
                      passed
                        ? "text-sm text-[#4caf50]"
                        : "text-sm text-[#ff6b6b]"
                    }
                  >
                    {passed ? `通過，得 ${g.points} 分` : "未通過，得 0 分"}
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-head w-24">測資</th>
                      <th className="table-head">結果</th>
                      <th className="table-head w-28 text-right">時間</th>
                      <th className="table-head w-28 text-right">記憶體</th>
                      <th className="table-head w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.results.map((r) => (
                      <Fragment key={r.order}>
                        <tr>
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
                          <td className="table-cell text-right">
                            {r.input != null && (
                              <button
                                className="text-xs text-blue hover:underline"
                                onClick={() =>
                                  setExpanded(
                                    expanded === r.order ? null : r.order,
                                  )
                                }
                              >
                                {expanded === r.order ? "收起" : "測資"}
                              </button>
                            )}
                          </td>
                        </tr>
                        {expanded === r.order && r.input != null && (
                          <tr>
                            <td colSpan={5} className="border-t border-bd p-0">
                              <TestCasePanel
                                input={r.input}
                                expectedOutput={r.expectedOutput!}
                                actualOutput={r.actualOutput}
                              />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {!hasSubtasks && data.results.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head w-24">測資</th>
                <th className="table-head">結果</th>
                <th className="table-head w-28 text-right">時間</th>
                <th className="table-head w-28 text-right">記憶體</th>
                <th className="table-head w-20"></th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <Fragment key={r.order}>
                  <tr>
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
                    <td className="table-cell text-right">
                      {r.input != null && (
                        <button
                          className="text-xs text-blue hover:underline"
                          onClick={() =>
                            setExpanded(expanded === r.order ? null : r.order)
                          }
                        >
                          {expanded === r.order ? "收起" : "測資"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === r.order && r.input != null && (
                    <tr>
                      <td colSpan={5} className="border-t border-bd p-0">
                        <TestCasePanel
                          input={r.input}
                          expectedOutput={r.expectedOutput!}
                          actualOutput={r.actualOutput}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
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
