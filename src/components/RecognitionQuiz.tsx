"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import QuestionHeader from "@/components/QuestionHeader";
import StatementCard from "@/components/StatementCard";
import CodeBlock from "@/components/CodeBlock";
import AnswerOptions from "@/components/AnswerOptions";
import CategoryBadge from "@/components/CategoryBadge";

export interface QuizQuestion {
  id: number;
  title: string;
  statement: string;
  code: string | null;
  options: string[];
  // 畫面選項順序：displayOrder[i] 是畫面第 i 個選項在 options 的索引
  displayOrder: number[];
  answerIndex: number;
  explanation: string | null;
  paper: string | null;
  sourceNumber: number | null;
  category: string | null;
  // 上次的作答狀態（RecognitionAnswer；未登入或沒答過為 null）
  initialStatus: "AC" | "WA" | null;
  initialPicked: number | null;
}

interface AnswerState {
  picked: number;
  correct: boolean;
}

interface Props {
  questions: QuizQuestion[];
  loggedIn: boolean;
  clusterLabel: string;
  backHref: string;
  // 從網址 ?q= 還原的起始題號（0-based）；沒帶或超範圍時為 0
  initialIndex?: number;
}

export default function RecognitionQuiz({
  questions,
  loggedIn,
  clusterLabel,
  backHref,
  initialIndex = 0,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [answers, setAnswers] = useState<Map<number, AnswerState>>(
    () =>
      new Map(
        questions
          .filter((q) => q.initialStatus)
          .map((q) => [
            q.id,
            { picked: q.initialPicked ?? 0, correct: q.initialStatus === "AC" },
          ]),
      ),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  const q = questions[index];
  // 題目每次載入由伺服器洗牌；這裡只做顯示與原始索引的換算
  const displayOptions = q.displayOrder.map((oi) => q.options[oi]);
  const correctDisplay = q.displayOrder.indexOf(q.answerIndex);

  const paperGroups = useMemo(() => {
    const groups: { paper: string | null; start: number; end: number }[] = [];
    let cur: string | null = null;
    questions.forEach((qq, i) => {
      // 空字串與 null 視為同一種「沒有卷別」，避免同一群集被拆成兩組
      const paper = qq.paper?.trim() || null;
      if (groups.length === 0 || paper !== cur) {
        cur = paper;
        groups.push({ paper, start: i, end: i });
      } else {
        groups[groups.length - 1].end = i;
      }
    });
    return groups;
  }, [questions]);

  // 只有真的有多個「有名稱的卷別」時才需要分隔線與圖例
  const namedPaperGroups = paperGroups.filter((g) => g.paper);
  const showPaperGroups = namedPaperGroups.length > 1;

  const answeredCount = questions.filter((qq) => answers.has(qq.id)).length;
  const correctCount = questions.filter(
    (qq) => answers.get(qq.id)?.correct,
  ).length;

  function goTo(i: number) {
    setIndex(i);
    // 只更新網址不重新導覽：重整或分享連結時用 ?q= 回到同一題
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("q", String(i + 1));
      window.history.replaceState(null, "", url);
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function pick(selectedDisplayIndex: number) {
    if (answers.has(q.id) || submitting) return;
    // AnswerOptions 給的是畫面上的位置，換回原始索引再判定、存檔
    const selectedIndex = q.displayOrder[selectedDisplayIndex] ?? selectedDisplayIndex;
    setError("");
    // 未登入：只在畫面上判定，不寫任何紀錄
    if (!loggedIn) {
      const next = new Map(answers);
      next.set(q.id, {
        picked: selectedIndex,
        correct: selectedIndex === q.answerIndex,
      });
      setAnswers(next);
      return;
    }
    // 登入：寫入 RecognitionAnswer（不是 Submission），下次回來可還原狀態
    setSubmitting(true);
    try {
      const res = await fetch("/api/recognition-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: q.id, selectedIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "送出失敗");
        return;
      }
      const next = new Map(answers);
      next.set(q.id, { picked: selectedIndex, correct: data.correct });
      setAnswers(next);
    } catch {
      setError("送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  async function retry() {
    if (submitting) return;
    setError("");
    const next = new Map(answers);
    next.delete(q.id);
    // 未登入沒有伺服器紀錄，清掉前端狀態就好
    if (!loggedIn) {
      setAnswers(next);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/recognition-answers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId: q.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "重新作答失敗");
        return;
      }
      setAnswers(next);
    } catch {
      setError("重新作答失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  }

  // 鍵盤快捷鍵：A-E / 1-5 選答，←/→ 切題，Esc 收起題號總覽。
  // 不用依賴陣列（每次 render 重掛 listener），確保拿到最新的 index/answers。
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        if (index > 0) {
          e.preventDefault();
          goTo(index - 1);
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (index < questions.length - 1) {
          e.preventDefault();
          goTo(index + 1);
        }
        return;
      }
      let picked = -1;
      if (e.key >= "1" && e.key <= "5") {
        picked = Number(e.key) - 1;
      } else if (/^[a-eA-E]$/.test(e.key)) {
        picked = e.key.toUpperCase().charCodeAt(0) - 65;
      }
      if (picked >= 0 && picked < q.options.length) {
        e.preventDefault();
        void pick(picked);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const state = answers.get(q.id);
  const answered = state !== undefined;

  // 題號總覽做成「上一題／下一題」中間的按鈕，面板往上展開
  return (
    <div className="space-y-5" ref={topRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="page-title">{clusterLabel}</h1>
          <Link href={backHref} className="text-sm text-blue hover:underline">
            ← 回群集列表
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="mono text-dim">
            已答 {answeredCount} / {questions.length}
          </span>
          {correctCount > 0 && (
            <span className="mono font-semibold text-[#4caf50]">
              答對 {correctCount}
            </span>
          )}
        </div>
      </div>

      {/* 目前題目（與題目頁共用同一組元件） */}
      <div className="space-y-6">
        <QuestionHeader
          compact
          title={q.title}
          badges={<CategoryBadge category={q.category} />}
          sub={
            <>
              第 {index + 1} / {questions.length} 題
              {q.paper ? ` ・ ${q.paper}` : ""}
              {q.sourceNumber != null ? ` ・ 原題號 ${q.sourceNumber}` : ""}
            </>
          }
        />

        <StatementCard>{q.statement}</StatementCard>

        <CodeBlock code={q.code ?? ""} language={q.category} maxHeight="max-h-72" />

        <div className="card space-y-2 p-5">
          <AnswerOptions
            options={displayOptions}
            answerIndex={correctDisplay}
            picked={state ? q.displayOrder.indexOf(state.picked) : null}
            revealed={answered}
            disabled={submitting}
            onPick={pick}
          />

          {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}

          {answered && (
            <div
              className={`mt-2 rounded-lg px-4 py-3 text-sm ${
                state.correct
                  ? "bg-[rgba(76,175,80,0.08)] text-tx"
                  : "bg-[rgba(237,66,69,0.06)] text-tx"
              }`}
            >
              <p
                className={`font-semibold ${
                  state.correct ? "text-[#4caf50]" : "text-[#ff6b6b]"
                }`}
              >
                {state.correct
                  ? "答對了！"
                  : `答錯了，正確答案是 ${String.fromCharCode(65 + correctDisplay)}.`}
              </p>
              {q.explanation && (
                <Markdown className="prose-compact mt-1 text-dim">
                  {q.explanation}
                </Markdown>
              )}
              <button
                className="btn-secondary mt-3 px-3 py-1.5 text-xs"
                disabled={submitting}
                onClick={retry}
              >
                重新作答
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 上下題 與 題號總覽（面板從按鈕往上展開）：手機也維持同一列 */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <button
          className="btn-secondary whitespace-nowrap px-3 sm:px-5"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          ← 上一題
        </button>

        <div className="relative">
          {paletteOpen && (
            <>
              <button
                type="button"
                aria-label="關閉題號總覽"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setPaletteOpen(false)}
              />
              <div
                id="question-palette"
                role="dialog"
                aria-label="題號總覽"
                className="card absolute bottom-full left-1/2 z-50 mb-3 max-h-[60vh] w-[min(90vw,26rem)] -translate-x-1/2 overflow-y-auto p-4 shadow-xl"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {questions.map((qq, i) => {
                    const s = answers.get(qq.id);
                    const cls =
                      i === index
                        ? "bg-blue-deep text-white border-blue-deep"
                        : s
                          ? s.correct
                            ? "bg-[rgba(129,199,132,0.15)] text-[var(--green)] border-[var(--green)]/40"
                            : "bg-[rgba(237,66,69,0.12)] text-[#ff6b6b] border-[#ff6b6b]/40"
                          : "text-dim border-bd2";
                    const afterGroup = paperGroups.find((g) => g.end === i);
                    return (
                      <span key={qq.id} className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            goTo(i);
                            setPaletteOpen(false);
                          }}
                          aria-label={`第 ${i + 1} 題${
                            i === index
                              ? "（目前題目）"
                              : s
                                ? s.correct
                                  ? "，答對"
                                  : "，答錯"
                                : "，未作答"
                          }`}
                          aria-current={i === index ? "true" : undefined}
                          className={`h-8 w-8 rounded-md border text-xs font-mono transition-colors ${cls}`}
                        >
                          {i + 1}
                        </button>
                        {afterGroup &&
                          showPaperGroups &&
                          afterGroup.end < questions.length - 1 && (
                            <span className="mx-1 text-xs text-mute">│</span>
                          )}
                      </span>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-mute">
                  {showPaperGroups &&
                    namedPaperGroups.map((g) => (
                      <span key={g.start}>
                        {g.paper}：第 {g.start + 1}–{g.end + 1} 題
                      </span>
                    ))}
                  <span>
                    <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[rgba(129,199,132,0.4)]" />
                    答對
                  </span>
                  <span>
                    <i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[rgba(237,66,69,0.4)]" />
                    答錯
                  </span>
                </div>
              </div>
            </>
          )}
          <button
            type="button"
            aria-expanded={paletteOpen}
            aria-controls="question-palette"
            className="btn-secondary whitespace-nowrap px-3 sm:px-5"
            onClick={() => setPaletteOpen((v) => !v)}
          >
            {paletteOpen ? "收起題號" : `▦ 題號 ${index + 1}/${questions.length}`}
          </button>
        </div>

        <button
          className="btn-primary whitespace-nowrap px-3 sm:px-5"
          disabled={index === questions.length - 1}
          onClick={() => goTo(index + 1)}
        >
          下一題 →
        </button>
      </div>
    </div>
  );
}
