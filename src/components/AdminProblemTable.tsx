"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DifficultyBadge from "@/components/DifficultyBadge";

export interface AdminProblemRow {
  id: number;
  title: string;
  difficulty: string;
  isPublic: boolean;
  testCaseCount: number;
  submissionCount: number;
}

export default function AdminProblemTable({
  problems,
}: {
  problems: AdminProblemRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(problems);
  const [movingId, setMovingId] = useState<number | null>(null);

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;

    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setMovingId(next[dir === -1 ? target : index].id);

    try {
      await fetch("/api/admin/problems/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: next.map((p) => p.id) }),
      });
      router.refresh();
    } finally {
      setMovingId(null);
    }
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="table-head w-16">排序</th>
          <th className="table-head w-16">#</th>
          <th className="table-head">標題</th>
          <th className="table-head w-24">難度</th>
          <th className="table-head w-20 text-right">測資</th>
          <th className="table-head w-20 text-right">提交</th>
          <th className="table-head w-24">狀態</th>
          <th className="table-head w-20"></th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={8} className="table-cell py-10 text-center text-mute">
              還沒有題目，點右上角「新增題目」開始出題
            </td>
          </tr>
        )}
        {rows.map((p, i) => (
          <tr key={p.id} className="hover:bg-panel2">
            <td className="table-cell">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="mono rounded border border-bd px-1.5 text-xs text-dim hover:border-bd2 hover:text-tx disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || movingId !== null}
                  aria-label="上移"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="mono rounded border border-bd px-1.5 text-xs text-dim hover:border-bd2 hover:text-tx disabled:cursor-not-allowed disabled:opacity-30"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1 || movingId !== null}
                  aria-label="下移"
                >
                  ▼
                </button>
              </div>
            </td>
            <td className="table-cell text-dim">{p.id}</td>
            <td className="table-cell font-medium">
              <Link href={`/problems/${p.id}`} className="text-blue hover:underline">
                {p.title}
              </Link>
            </td>
            <td className="table-cell">
              <DifficultyBadge difficulty={p.difficulty} />
            </td>
            <td className="table-cell text-right text-dim">{p.testCaseCount}</td>
            <td className="table-cell text-right text-dim">{p.submissionCount}</td>
            <td className="table-cell text-sm text-dim">
              {p.isPublic ? "公開" : "未公開"}
            </td>
            <td className="table-cell">
              <Link
                href={`/admin/problems/${p.id}/edit`}
                className="text-sm text-blue hover:underline"
              >
                編輯
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
