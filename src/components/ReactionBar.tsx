"use client";

import {
  REACTION_EMOJIS,
  type ReactionSummary,
} from "@/lib/reactions";

// 留言與題解的表情列。固定顯示全部表情（沒人按過的淡色顯示），
// 已按的以藍框標示；未登入或不能回應時整列唯讀。
export default function ReactionBar({
  reactions,
  canReact,
  onToggle,
  disabled = false,
}: {
  reactions: ReactionSummary[];
  canReact: boolean;
  onToggle?: (emoji: string) => void;
  disabled?: boolean;
}) {
  const byEmoji = new Map(reactions.map((r) => [r.emoji, r]));
  const clickable = canReact && !disabled;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {REACTION_EMOJIS.map((emoji) => {
        const r = byEmoji.get(emoji);
        const active = r?.mine ?? false;
        return (
          <button
            key={emoji}
            type="button"
            disabled={!clickable}
            aria-pressed={active}
            title={canReact ? "點一下切換表情" : "登入後可以回應"}
            onClick={() => onToggle?.(emoji)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors ${
              active
                ? "border-blue bg-inset text-tx"
                : "border-bd2 text-dim"
            } ${clickable ? "hover:bg-inset" : "cursor-default opacity-70"}`}
          >
            <span aria-hidden="true">{emoji}</span>
            {r && r.count > 0 && (
              <span className="mono text-xs">{r.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
