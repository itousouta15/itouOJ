"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import VerdictBadge from "@/components/VerdictBadge";

export interface HomeSubmissionRowData {
  id: number;
  status: string;
  createdAtLabel: string;
  username: string;
  displayName?: string | null;
  problem: { id: number; order: number; title: string };
}

// 同 SubmissionRow：< md 卡片、≥ md 表格列
export default function HomeSubmissionRow({
  s,
  columns = 5,
}: {
  s: HomeSubmissionRowData;
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
        <td className="table-cell">
          <VerdictBadge status={s.status} short />
        </td>
        <td className="table-cell text-right text-dim">{s.createdAtLabel}</td>
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
              <span className="mono">#{s.id}</span>
              <Link
                href={`/users/${s.username}`}
                className="text-blue hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {s.displayName || s.username}
              </Link>
              <span className="ml-auto mono text-mute">{s.createdAtLabel}</span>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}