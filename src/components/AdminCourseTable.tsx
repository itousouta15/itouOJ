"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CourseRow {
  id: number;
  title: string;
  isPublic: boolean;
  joinCode: string | null;
  _count: { problems: number; members: number };
}

export default function AdminCourseTable({
  courses,
}: {
  courses: CourseRow[];
}) {
  const router = useRouter();
  const [ids, setIds] = useState(() => courses.map((course) => course.id));
  const [savedIds, setSavedIds] = useState(ids);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const byId = new Map(courses.map((course) => [course.id, course]));
  const dirty = ids.some((id, index) => id !== savedIds[index]);

  function move(index: number, offset: number) {
    setIds((current) => {
      const next = [...current];
      const destination = index + offset;
      if (destination < 0 || destination >= next.length) return current;
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
    setSuccess("");
  }

  async function saveOrder() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/courses/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, expectedIds: savedIds }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "儲存排序失敗");
        return;
      }
      setSavedIds(ids);
      setSuccess("課程順序已儲存");
      router.refresh();
    } catch {
      setError("儲存排序失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-dim">
          使用上下按鈕調整課程頁面的顯示順序，再儲存排序。
        </p>
        {dirty && (
          <>
            <span className="text-sm text-amber">排序尚未儲存</span>
            <button
              type="button"
              className="btn-primary"
              disabled={saving}
              onClick={saveOrder}
            >
              {saving ? "儲存中…" : "儲存排序"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => {
                setIds(savedIds);
                setError("");
              }}
            >
              取消
            </button>
          </>
        )}
      </div>
      {success && (
        <p role="status" className="text-sm text-green">
          {success}
        </p>
      )}
      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-[#ff6b6b]">
            {error}
          </p>
          <button
            type="button"
            className="btn-secondary"
            disabled={saving}
            onClick={() => router.refresh()}
          >
            重新整理
          </button>
        </div>
      )}
      <p className="mono text-[11px] text-mute sm:hidden">
        ← 左右滑動可看到更多欄位 →
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-head w-32">順序</th>
              <th className="table-head w-16">#</th>
              <th className="table-head">標題</th>
              <th className="table-head w-24 text-right">題數</th>
              <th className="table-head w-24 text-right">成員</th>
              <th className="table-head w-28">加入代碼</th>
              <th className="table-head w-24">狀態</th>
              <th className="table-head w-24">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ids.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="table-cell py-10 text-center text-mute"
                >
                  還沒有課程
                </td>
              </tr>
            )}
            {ids.map((id, index) => {
              const course = byId.get(id)!;
              return (
                <tr key={id} className="hover:bg-panel2">
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <span className="mono w-6 text-dim">{index + 1}</span>
                      <button
                        type="button"
                        className="btn-secondary px-2 py-1"
                        disabled={saving || index === 0}
                        aria-label={`將「${course.title}」上移`}
                        onClick={() => move(index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-2 py-1"
                        disabled={saving || index === ids.length - 1}
                        aria-label={`將「${course.title}」下移`}
                        onClick={() => move(index, 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="table-cell text-dim">{id}</td>
                  <td className="table-cell">
                    <Link
                      href={`/courses/${id}`}
                      className="font-medium text-blue hover:underline"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="table-cell text-right text-dim">
                    {course._count.problems}
                  </td>
                  <td className="table-cell text-right text-dim">
                    {course._count.members}
                  </td>
                  <td className="table-cell">
                    {course.joinCode ? (
                      <span className="mono text-sm text-purple">
                        {course.joinCode}
                      </span>
                    ) : (
                      <span className="text-sm text-mute">開放加入</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {course.isPublic ? (
                      <span className="vbadge vbadge-green">公開</span>
                    ) : (
                      <span className="vbadge vbadge-gray">未公開</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <Link
                      href={`/admin/courses/${id}/edit`}
                      className="text-sm text-blue hover:underline"
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
