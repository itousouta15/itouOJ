import Link from "next/link";
import { problemHref } from "@/lib/problemTypes";
import type { FeedItem } from "@/lib/activityFeed";

const KIND_META = {
  ac: { label: "AC", cls: "vbadge-green", verb: "通過了" },
  solution: { label: "題解", cls: "vbadge-blue", verb: "發表了題解" },
  comment: { label: "留言", cls: "vbadge-gray", verb: "留言" },
} as const;

function formatAt(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "2-digit",
    day: "2-digit",
  });
}

// 動態牆列表：首頁的追蹤動態與 /activity 共用同一份排版。
export default function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-mute">還沒有動態</p>
    );
  }
  return (
    <div className="card">
      {items.map((f) => {
        const meta = KIND_META[f.kind];
        const href = problemHref({
          type: f.problemType,
          order: f.problemOrder,
          id: f.problemId,
        });
        return (
          <div
            key={f.key}
            className="flex items-start gap-3 border-b border-bd px-4 py-3 last:border-b-0"
          >
            <span className={`vbadge ${meta.cls} shrink-0`}>{meta.label}</span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate">
                <Link
                  href={`/users/${f.username}`}
                  className="font-medium text-blue hover:underline"
                >
                  {f.displayName || f.username}
                </Link>
                <span className="text-dim"> {meta.verb} </span>
                <Link href={href} className="text-blue hover:underline">
                  #{f.problemOrder} {f.problemTitle}
                </Link>
              </p>
              {f.detail && (
                <p className="mt-0.5 truncate text-mute">
                  {f.kind === "solution" ? `「${f.detail}」` : f.detail}
                </p>
              )}
            </div>
            <span className="mono shrink-0 text-xs text-mute">
              {formatAt(f.at)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
