"use client";

import { useState } from "react";
import VerdictBadge from "@/components/VerdictBadge";
import Markdown from "@/components/Markdown";
import AnswerOptions from "@/components/AnswerOptions";

interface Props {
  options: string[];
  // 畫面選項順序：displayOrder[i] 是畫面第 i 個選項在 options 的索引
  displayOrder: number[];
  explanation: string | null;
  answerIndex: number;
  locked: boolean;
}

// 識別題不做紀錄：作答在瀏覽器端即時判定，不建立 Submission。
export default function RecognitionAnswerPanel({
  options,
  displayOrder,
  explanation,
  answerIndex,
  locked,
}: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<"AC" | "WA" | null>(null);

  const answered = picked !== null && status !== null;
  const displayOptions = displayOrder.map((oi) => options[oi]);
  const correctDisplay = displayOrder.indexOf(answerIndex);

  function pick(selectedIndex: number) {
    if (locked || answered) return;
    setPicked(selectedIndex);
    setStatus(selectedIndex === correctDisplay ? "AC" : "WA");
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
        options={displayOptions}
        answerIndex={correctDisplay}
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
