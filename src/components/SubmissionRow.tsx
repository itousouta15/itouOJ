"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VerdictBadge from "@/components/VerdictBadge";
import { LANGUAGES, isLanguageKey } from "@/lib/languages";

export interface SubmissionRowData {
  id: number;
  status: string;
  language: string;
  timeMs: number | null;
  memoryKb: number | null;
  createdAtLabel: string;
  username: string;
  displayName?: string | null;
  problem: { id: number; order: number; title: string };
}

// 同一筆資料渲染兩種版型：< md 是卡片，≥ md 是表格列。
// 兩者都用 <tr> 包住，<tbody> 的結構才不會壞。
export default function SubmissionRow({
  s,
  columns = 8,
}: {
  s: SubmissionRowData;
  columns?: number;
}) {
  const router = useRouter();

  return (
    <>
      <tr
        className="hidden cursor-pointer hover:bg-panel2 sm:table-row"
        onClick={() => router.push(`/submissions/${s.id}`)}
      >
        <td className="table-cell mono text-dim">{s.id}</td>
        <td className="table-cell">
          <Link
            href={`/problems/${s.problem.order}`}
            className="font-medium text-blue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {s.problem.title}
          </Link>
        </td>
        <td className="table-cell">
          <Link
            href={`/users/${s.username}`}
            className="text-blue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {s.displayName || s.username}
          </Link>
        </td>
        <td className="table-cell text-dim">
          {isLanguageKey(s.language) ? LANGUAGES[s.language].label : s.language}
        </td>
        <td className="table-cell">
          <VerdictBadge status={s.status} />
        </td>
        <td className="table-cell text-right text-dim">
          {s.timeMs != null ? `${s.timeMs} ms` : "—"}
        </td>
        <td className="table-cell text-right text-dim">
          {s.memoryKb != null ? `${Math.round(s.memoryKb / 1024)} MB` : "—"}
        </td>
        <td className="table-cell text-dim">{s.createdAtLabel}</td>
      </tr>
      <tr
        className="cursor-pointer hover:bg-panel2 sm:hidden"
        onClick={() => router.push(`/submissions/${s.id}`)}
      >
        <td colSpan={columns} className="border-t border-bd p-0">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/problems/${s.problem.order}`}
                className="min-w-0 flex-1 truncate font-medium text-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {s.problem.title}
              </Link>
              <VerdictBadge status={s.status} short />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-dim">
              <span>
                #
                <Link
                  href={`/submissions/${s.id}`}
                  className="mono text-mute hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {s.id}
                </Link>
              </span>
              <Link
                href={`/users/${s.username}`}
                className="text-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {s.displayName || s.username}
              </Link>
              <span className="mono">
                {isLanguageKey(s.language)
                  ? LANGUAGES[s.language].label
                  : s.language}
              </span>
              <span className="mono">
                {s.timeMs != null ? `${s.timeMs} ms` : "—"}
              </span>
              <span className="mono">
                {s.memoryKb != null
                  ? `${Math.round(s.memoryKb / 1024)} MB`
                  : "—"}
              </span>
              <span className="ml-auto mono text-mute">{s.createdAtLabel}</span>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}