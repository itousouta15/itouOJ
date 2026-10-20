import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import CourseJoinButton from "@/components/CourseJoinButton";
import {
  buildCourseUnits,
  courseDifficultyOptions,
  courseEntryHref,
  courseEntryLesson,
  courseEntryLevel,
  filterCourseUnits,
  type CourseSearchParams,
} from "@/lib/courseOverview";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<CourseSearchParams>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) notFound();
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          id: true,
          problemId: true,
          problem: {
            select: {
              id: true,
              order: true,
              problemCode: true,
              title: true,
              type: true,
              isPublic: true,
              category: true,
              difficulty: true,
            },
          },
        },
      },
      _count: { select: { members: true } },
    },
  });
  if (!course || (!course.isPublic && !isAdmin)) notFound();
  const entries = course.problems.filter(
    (cp) => isAdmin || cp.problem.isPublic,
  );
  let joined = false;
  const solvedSet = new Set<number>();
  if (session) {
    const [membership, solved] = await Promise.all([
      prisma.courseMember.findUnique({
        where: { courseId_userId: { courseId, userId: session.userId } },
      }),
      prisma.submission.findMany({
        where: {
          userId: session.userId,
          status: "AC",
          problemId: { in: entries.map((e) => e.problemId) },
        },
        distinct: ["problemId"],
        select: { problemId: true },
      }),
    ]);
    joined = membership !== null;
    for (const entry of solved) solvedSet.add(entry.problemId);
  }
  const total = entries.length;
  const solvedCount = entries.filter((e) => solvedSet.has(e.problemId)).length;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
  const allUnits = buildCourseUnits(course.title, entries);
  const filters = filterCourseUnits(course.title, allUnits, await searchParams);
  const basePath = `/courses/${course.id}`;

  // Membership guards and statistics use the full visible course, never the search results.
  let board:
    { id: string; name: string; solved: number; subs: number }[] | null = null;
  if (joined || isAdmin) {
    const members = await prisma.courseMember.findMany({
      where: { courseId },
      include: {
        user: { select: { id: true, username: true, displayName: true } },
      },
    });
    const memberIds = members.map((m) => m.user.id);
    const problemIds = entries.map((e) => e.problemId);
    const [acPairs, subCounts] = await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: { in: memberIds },
          problemId: { in: problemIds },
          status: "AC",
        },
        distinct: ["userId", "problemId"],
        select: { userId: true },
      }),
      prisma.submission.groupBy({
        by: ["userId"],
        where: { userId: { in: memberIds }, problemId: { in: problemIds } },
        _count: { _all: true },
      }),
    ]);
    const solvedBy = new Map<string, number>();
    for (const { userId } of acPairs)
      solvedBy.set(userId, (solvedBy.get(userId) ?? 0) + 1);
    const subsBy = new Map(subCounts.map((g) => [g.userId, g._count._all]));
    board = members
      .map((m) => ({
        id: m.user.id,
        name: m.user.displayName || m.user.username,
        solved: solvedBy.get(m.user.id) ?? 0,
        subs: subsBy.get(m.user.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.solved - a.solved ||
          a.subs - b.subs ||
          a.name.localeCompare(b.name),
      );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="card space-y-3 p-5 sm:p-7">
        <Link href="/courses" className="text-sm text-mute hover:text-blue">
          ← 所有課程
        </Link>
        <p className="mono text-xs uppercase tracking-[0.2em] text-mute">
          Learning path · Guided practice
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title break-words">{course.title}</h1>
          {!course.isPublic && (
            <span className="vbadge vbadge-gray">未公開</span>
          )}
          {isAdmin && (
            <Link
              href={`/admin/courses/${course.id}/edit`}
              className="text-sm text-blue hover:underline"
            >
              編輯課程
            </Link>
          )}
        </div>
        {course.description && (
          <p className="max-w-3xl whitespace-pre-line text-sm leading-7 text-dim">
            {course.description}
          </p>
        )}
        <p className="mono text-sm text-mute">
          {total} 題 · {allUnits.length} 個單元 · {course._count.members} 位成員
          · {session ? `${solvedCount} 題已完成` : "登入後以 AC 紀錄追蹤進度"}
        </p>
        <p className="text-xs text-mute">
          展開單元選擇題目；有教學的題目可先看觀念、動畫與程式，再前往實作。
          {course.joinCode && " 加入此課程需要代碼。"}
          {isAdmin && course.joinCode && (
            <span className="ml-2 text-purple">代碼：{course.joinCode}</span>
          )}
        </p>
      </header>

      <section
        aria-label="加入課程與進度"
        className="card flex flex-wrap items-center gap-5 p-5"
      >
        {session ? (
          <>
            <CourseJoinButton
              courseId={course.id}
              joined={joined}
              requiresCode={Boolean(course.joinCode)}
            />
            {joined && (
              <div className="min-w-40 flex-1">
                <div className="mb-1 flex justify-between text-xs text-dim">
                  <span>整門課解題進度</span>
                  <span className="mono">
                    {solvedCount} / {total}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="整門課解題進度"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-inset"
                >
                  <div
                    className="h-full rounded-full bg-[var(--green)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-dim">
            <Link href="/login" className="text-blue hover:underline">
              登入
            </Link>
            後即可加入課程、追蹤解題進度
          </p>
        )}
      </section>

      <form
        action={basePath}
        role="search"
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]"
      >
        <label className="min-w-0 text-sm text-dim">
          題號、名稱或方法
          <input
            key={filters.query}
            type="search"
            name="q"
            defaultValue={filters.query}
            placeholder="例如 a029、背包、動態規劃"
            className="input mt-1 w-full"
          />
        </label>
        <label className="min-w-0 text-sm text-dim">
          主題單元
          <select
            key={filters.topic}
            name="topic"
            defaultValue={filters.topic}
            className="input mt-1 block w-full lg:max-w-72"
          >
            <option value="">全部單元</option>
            {allUnits.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm text-dim">
          題目難度
          <select
            key={filters.level}
            name="level"
            defaultValue={filters.level}
            className="input mt-1 block w-full"
          >
            <option value="">全部難度</option>
            {courseDifficultyOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            篩選
          </button>
          {filters.active && (
            <Link href={basePath} className="btn-secondary">
              清除
            </Link>
          )}
        </div>
      </form>

      <p role="status" className="text-sm text-mute">
        顯示 {filters.count} / {total}{" "}
        題。依課程安排分組，單元內保留設定順序，展開即可選課。
      </p>
      {filters.units.length === 0 ? (
        <div className="card p-8 text-center text-dim">
          {total ? "沒有符合的題目，請調整搜尋條件。" : "這門課還沒有題目"}
        </div>
      ) : (
        <div className="space-y-4">
          {filters.units.map((unit) => {
            const fullUnit = allUnits.find((item) => item.id === unit.id)!;
            const completed = fullUnit.entries.filter((entry) =>
              solvedSet.has(entry.problemId),
            ).length;
            return (
              <details
                key={unit.id}
                id={unit.id}
                open={filters.active}
                className="card scroll-mt-24 overflow-hidden"
              >
                <summary className="cursor-pointer px-5 py-4 hover:bg-panel2">
                  <span className="font-semibold">{unit.title}</span>
                  <span className="mono ml-3 text-xs text-mute">
                    {filters.active
                      ? `顯示 ${unit.entries.length} / ${fullUnit.entries.length} 題`
                      : `${unit.entries.length} 題`}
                    {session &&
                      ` · 全單元 ${completed} / ${fullUnit.entries.length} 題已完成`}
                  </span>
                </summary>
                <div className="space-y-4 border-t border-bd p-4 sm:p-5">
                  <p className="text-sm text-dim">{unit.intro}</p>
                  {unit.focus.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {unit.focus.map((focus) => (
                        <li key={focus} className="vbadge vbadge-blue">
                          {focus}
                        </li>
                      ))}
                    </ul>
                  )}
                  <ol className="grid gap-2 md:grid-cols-2">
                    {unit.entries.map((entry) => {
                      const problem = entry.problem;
                      const lesson = courseEntryLesson(course.title, entry);
                      const href = courseEntryHref(
                        course.id,
                        course.title,
                        entry,
                      );
                      const solved = solvedSet.has(entry.problemId);
                      const className = `flex h-full items-start gap-3 rounded-lg border border-bd p-3 ${href ? "hover:bg-panel2" : ""} ${solved ? "row-solved" : ""}`;
                      const content = (
                        <>
                          <span className="min-w-0 flex-1">
                            <span className="mono block text-xs text-mute">
                              {problem.problemCode ?? `題目 ${problem.order}`} ·{" "}
                              {solved
                                ? "已完成"
                                : lesson
                                  ? "開始教學"
                                  : href
                                    ? "開始練習"
                                    : "題號尚未設定"}
                              {!problem.isPublic && " · 未公開"}
                            </span>
                            <span className="mt-1 block break-words font-medium">
                              {problem.title}
                            </span>
                            {lesson && (
                              <span className="mt-1 block text-xs text-dim">
                                {lesson.concept}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0">
                            {problem.type === "RECOGNITION" ? (
                              <span className="vbadge vbadge-blue">
                                {problem.category ?? "選擇題"}
                              </span>
                            ) : courseEntryLevel(entry) === "other" ? (
                              <span className="vbadge vbadge-gray">未分類</span>
                            ) : (
                              <DifficultyBadge
                                difficulty={problem.difficulty}
                              />
                            )}
                          </span>
                        </>
                      );
                      return (
                        <li key={entry.id} data-course-entry={entry.id}>
                          {href ? (
                            <Link
                              prefetch={false}
                              href={href}
                              className={className}
                            >
                              {content}
                            </Link>
                          ) : (
                            <div className={className}>{content}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </details>
            );
          })}
        </div>
      )}

      {board ? (
        <section aria-label="課程排行">
          <h2 className="section-title mb-3">課程排行</h2>
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-head w-20">名次</th>
                  <th className="table-head">成員</th>
                  <th className="table-head w-28 text-right">解題數</th>
                  <th className="table-head w-28 text-right">提交數</th>
                </tr>
              </thead>
              <tbody>
                {board.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="table-cell py-10 text-center text-mute"
                    >
                      還沒有成員
                    </td>
                  </tr>
                )}
                {board.map((r, i) => (
                  <tr key={r.id} className="hover:bg-panel2">
                    <td className="table-cell font-semibold text-dim">
                      {i + 1}
                    </td>
                    <td className="table-cell font-medium">{r.name}</td>
                    <td className="table-cell text-right font-semibold text-[var(--green)]">
                      {r.solved} / {total}
                    </td>
                    <td className="table-cell text-right text-dim">{r.subs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        session && (
          <p className="text-sm text-mute">加入課程後即可查看課程內部排行。</p>
        )
      )}
      <p className="text-center text-sm text-mute">
        <Link href="/courses" className="text-blue hover:underline">
          ← 所有課程
        </Link>
      </p>
    </div>
  );
}
