"use client";

// 選擇題選項：識別題練習、詳情頁與比賽作答面板共用。
// revealed = 已揭曉（作答過或詳情頁）：正確選項標綠、選錯標紅、其餘淡出。
export default function AnswerOptions({
  options,
  answerIndex,
  picked,
  revealed,
  disabled = false,
  onPick,
}: {
  options: string[];
  answerIndex: number;
  picked: number | null;
  revealed: boolean;
  disabled?: boolean;
  onPick?: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, i) => {
        const isCorrect = i === answerIndex;
        const isPicked = picked === i;
        let cls =
          "w-full rounded-lg border border-bd2 px-4 py-2.5 text-left text-sm transition-colors";
        if (!revealed) {
          cls += disabled ? " opacity-60" : " hover:bg-inset";
        } else if (isCorrect) {
          cls += " border-[var(--green)] bg-[rgba(129,199,132,0.12)] text-tx";
        } else if (isPicked) {
          cls += " border-[#ff6b6b] bg-[rgba(237,66,69,0.1)] text-tx";
        } else {
          cls += " opacity-60";
        }
        return (
          <button
            key={i}
            disabled={revealed || disabled}
            onClick={() => onPick?.(i)}
            className={cls}
          >
            <span className="mr-2 font-mono text-xs text-dim">
              {String.fromCharCode(65 + i)}.
            </span>
            <span className="font-mono whitespace-pre-wrap">{opt}</span>
            {revealed && isCorrect && (
              <span className="ml-2 text-[var(--green)]">✓</span>
            )}
            {revealed && isPicked && !isCorrect && (
              <span className="ml-2 text-[#ff6b6b]">✗</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
