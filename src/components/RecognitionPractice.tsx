"use client";

import { useMemo, useState } from "react";

export interface RecognitionQuestionRow {
  id: number;
  code: string;
  question: string;
  category: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  order: number;
}

interface Props {
  questions: RecognitionQuestionRow[];
  categories: string[];
}

export default function RecognitionPractice({ questions, categories }: Props) {
  const [filter, setFilter] = useState("全部");
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [score, setScore] = useState(0);

  const visible = useMemo(
    () =>
      filter === "全部"
        ? questions
        : questions.filter((q) => q.category === filter),
    [questions, filter]
  );

  function pick(q: RecognitionQuestionRow, i: number) {
    if (answers.has(q.id)) return;
    const next = new Map(answers);
    next.set(q.id, i);
    setAnswers(next);
    if (i === q.answerIndex) setScore((s) => s + 1);
  }

  const answeredCount = visible.filter((q) => answers.has(q.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`pill ${filter === c ? "pill-active" : ""}`}
            >
              {c}
            </button>
          ))}
        </div>
        {answeredCount > 0 && (
          <p className="mono text-sm text-dim">
            已答 {answeredCount} / {visible.length}
          </p>
        )}
        {score > 0 && (
          <p className="mono text-sm font-semibold text-[#4caf50]">
            答對 {score} 題
          </p>
        )}
      </div>

      {visible.length === 0 && (
        <div className="card p-10 text-center text-mute">
          這個類別還沒有練習題。
        </div>
      )}

      {visible.map((q) => {
        const picked = answers.get(q.id);
        const answered = picked !== undefined;
        return (
          <div key={q.id} className="card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-bd px-5 py-3">
              <p className="font-medium">{q.question}</p>
              <span
                className={`vbadge ${
                  q.category === "Python" ? "vbadge-purple" : "vbadge-blue"
                }`}
              >
                {q.category}
              </span>
            </div>

            <pre className="max-h-72 overflow-auto bg-inset p-5 font-mono text-[13px] leading-relaxed whitespace-pre">
              {q.code}
            </pre>

            <div className="space-y-2 p-5">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answerIndex;
                const isPicked = picked === i;
                let cls =
                  "w-full rounded-lg border border-bd2 px-4 py-2.5 text-left text-sm transition-colors";
                if (!answered) {
                  cls += " hover:bg-inset";
                } else if (isCorrect) {
                  cls += " border-[#4caf50] bg-[rgba(76,175,80,0.12)] text-tx";
                } else if (isPicked) {
                  cls += " border-[#ff6b6b] bg-[rgba(237,66,69,0.1)] text-tx";
                } else {
                  cls += " opacity-60";
                }
                return (
                  <button
                    key={i}
                    disabled={answered}
                    onClick={() => pick(q, i)}
                    className={cls}
                  >
                    <span className="mr-2 font-mono text-xs text-dim">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <span className="font-mono whitespace-pre-wrap">{opt}</span>
                    {answered && isCorrect && (
                      <span className="ml-2 text-[#4caf50]">✓</span>
                    )}
                    {answered && isPicked && !isCorrect && (
                      <span className="ml-2 text-[#ff6b6b]">✗</span>
                    )}
                  </button>
                );
              })}

              {answered && (
                <div
                  className={`mt-2 rounded-lg px-4 py-3 text-sm ${
                    picked === q.answerIndex
                      ? "bg-[rgba(76,175,80,0.08)] text-tx"
                      : "bg-[rgba(237,66,69,0.06)] text-tx"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      picked === q.answerIndex ? "text-[#4caf50]" : "text-[#ff6b6b]"
                    }`}
                  >
                    {picked === q.answerIndex
                      ? "答對了！"
                      : `答錯了，正確答案是 ${String.fromCharCode(65 + q.answerIndex)}.`}
                  </p>
                  {q.explanation && (
                    <p className="mt-1 text-dim">{q.explanation}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}