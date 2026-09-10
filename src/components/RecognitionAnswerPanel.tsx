"use client";

import { useState } from "react";
import VerdictBadge from "@/components/VerdictBadge";
import Markdown from "@/components/Markdown";
import AnswerOptions from "@/components/AnswerOptions";

interface Props {
  options: string[];
  explanation: string | null;
  answerIndex: number;
  locked: boolean;
}

// 識別題不做紀錄：作答在瀏覽器端即時判定，不建立 Submission。
export default function RecognitionAnswerPanel({
  options,
  explanation,
  answerIndex,
  locked,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<"AC" | "WA" | null>(null);

  const answered = picked !== null && status !== null;

  function pick(selectedIndex: number) {
    if (locked || answered) return;
    setPicked(selectedIndex);
    setStatus(selectedIndex === answerIndex ? "AC" : "WA");
  }

  return (
    <div className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="section-title">作答</h2>
        {answered && <VerdictBadge status={status!} />}
      </div>

      {locked && (
        <p className="text-sm text-[#faa81a]">比賽已結束，無法再作答</p>
      )}

      <AnswerOptions
        options={options}
        answerIndex={answerIndex}
        picked={picked}
        revealed={answered}
        disabled={locked}
        onPick={pick}
      />

      {answered && !locked && (
        <div className="flex items-center gap-3">
          <button
            className="btn-secondary"
            onClick={() => {
              setPicked(null);
              setStatus(null);
            }}
          >
            重新作答
          </button>
          <p className="text-xs text-dim">
            識別題不計入比賽成績，純練習
          </p>
        </div>
      )}

      {answered && explanation && (
        <div className="border-t border-bd pt-3">
          <p className="mb-1 text-xs font-semibold text-dim">解析</p>
          <Markdown className="prose-compact">{explanation}</Markdown>
        </div>
      )}
    </div>
  );
}
