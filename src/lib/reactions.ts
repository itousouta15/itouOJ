// 留言與題解的表情回饋。固定一組表情，維持 UI 一致也讓後端好驗證；
// 一人對同一則可以同時按多種（Slack 風格）。
export const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🤔"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return (
    typeof value === "string" &&
    (REACTION_EMOJIS as readonly string[]).includes(value)
  );
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  // 目前登入者有沒有按這個表情
  mine: boolean;
}

// 樂觀更新用：切換自己對某個表情的反應，回傳新的摘要陣列。
export function toggleReaction(
  reactions: ReactionSummary[],
  emoji: string
): ReactionSummary[] {
  const existing = reactions.find((r) => r.emoji === emoji);
  if (!existing) return [...reactions, { emoji, count: 1, mine: true }];
  if (existing.mine) {
    return reactions
      .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
      .filter((r) => r.count > 0);
  }
  return reactions.map((r) =>
    r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r
  );
}

// 把資料庫的原始列聚合成畫面要的形狀（固定表情順序，只回有出現的）。
export function summarizeReactions(
  rows: { emoji: string; userId: string }[],
  userId?: string | null
): ReactionSummary[] {
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of rows) {
    const s = map.get(r.emoji) ?? { count: 0, mine: false };
    s.count++;
    if (userId && r.userId === userId) s.mine = true;
    map.set(r.emoji, s);
  }
  return REACTION_EMOJIS.filter((e) => map.has(e)).map((e) => ({
    emoji: e,
    ...map.get(e)!,
  }));
}
