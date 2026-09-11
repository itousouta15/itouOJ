"use client";

import { useMemo, useRef, useState } from "react";
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
}

export default function RecognitionQuiz({
  questions,
  loggedIn,
  clusterLabel,
  backHref,
}: Props) {
  const [index, setIndex] = useState(0);
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
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function pick(selectedIndex: number) {
    if (answers.has(q.id) || submitting) return;
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

  function retry() {
    const next = new Map(answers);
    next.delete(q.id);
    setAnswers(next);
  }

  const state = answers.get(q.id);
  const answered = state !== undefined;

  // pb-16 是留給右下角浮動題號鈕的空間，避免蓋到「下一題」
  return (
    <div className="space-y-5 pb-16" ref={topRef}>
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

        <CodeBlock code={q.code ?? ""} maxHeight="max-h-72" />

        <div className="card space-y-2 p-5">
          <AnswerOptions
            options={q.options}
            answerIndex={q.answerIndex}
            picked={state?.picked ?? null}
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
                  : `答錯了，正確答案是 ${String.fromCharCode(65 + q.answerIndex)}.`}
              </p>
              {q.explanation && (
                <Markdown className="prose-compact mt-1 text-dim">
                  {q.explanation}
                </Markdown>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 上下題 */}
      <div className="flex items-center justify-between gap-3">
        <button
          className="btn-secondary"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          ← 上一題
        </button>
        <div className="flex gap-3">
          {answered && (
            <button className="btn-secondary" onClick={retry}>
              重新作答
            </button>
          )}
          <button
            className="btn-primary"
            disabled={index === questions.length - 1}
            onClick={() => goTo(index + 1)}
          >
            下一題 →
          </button>
        </div>
      </div>

      {/* 浮動題號總覽：固定在右下角，跳題不用再滑回最上面 */}
      <div className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-end gap-2 md:bottom-6">
        {paletteOpen && (
          <>
            <button
              type="button"
              aria-label="關閉題號總覽"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setPaletteOpen(false)}
            />
            <div className="card relative z-50 max-h-[60vh] w-[min(90vw,26rem)] overflow-y-auto p-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-1.5">
                {questions.map((qq, i) => {
                  const s = answers.get(qq.id);
                  const cls =
                    i === index
                      ? "bg-blue text-white border-blue"
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
          className="btn-primary relative z-50 rounded-full px-5 shadow-xl"
          onClick={() => setPaletteOpen((v) => !v)}
        >
          {paletteOpen ? "收起題號" : `▦ 題號 ${index + 1}/${questions.length}`}
        </button>
      </div>
    </div>
  );
}
