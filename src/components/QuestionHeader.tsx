import type { ReactNode } from "react";
import Link from "next/link";
import TagBadge from "@/components/TagBadge";

// 題目頁共用的頁首：標題 + badges（難度/結果）+ 標籤 + 管理員編輯連結。
// 實作題、識別題、比賽題目頁都用同一份，維持版面一致。
export default function QuestionHeader({
  title,
  badges,
  tags,
  adminHref,
  sub,
  compact = false,
}: {
  title: string;
  badges?: ReactNode;
  tags?: { id: number; name: string }[];
  adminHref?: string;
  // 標題下方的資訊列（例如時間/記憶體限制、卷別/原題號）
  sub?: ReactNode;
  // 練習頁等標題不想當主標題（h1）時用 h2
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {compact ? (
          <h2 className="section-title">{title}</h2>
        ) : (
          <h1 className="page-title">{title}</h1>
        )}
        {badges}
        {tags?.map((t) => <TagBadge key={t.id} name={t.name} />)}
        {adminHref && (
          <Link
            href={adminHref}
            className="text-sm text-blue hover:underline"
          >
            編輯題目
          </Link>
        )}
      </div>
      {sub && <p className="mt-1 text-sm text-dim">{sub}</p>}
    </div>
  );
}
