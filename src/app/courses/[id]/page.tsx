import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DifficultyBadge from "@/components/DifficultyBadge";
import CourseJoinButton from "@/components/CourseJoinButton";
import { apcsCourseLessons } from "@/lib/apcsCourseLessons";

export const dynamic = "force-dynamic";

const apcsLearningGuide = {
  easy: {
    step: "01",
    title: "讀懂輸入，建立解題節奏",
    intro:
      "先把題目拆成「讀入什麼、要處理什麼、輸出什麼」。用範例手動走一次，再把重複步驟交給程式。",
    focus: ["輸入與輸出", "條件判斷", "迴圈與邊界"],
    checkpoint: "寫程式前，先說清楚每個變數代表什麼。",
  },
  medium: {
    step: "02",
    title: "整理多筆資料，追蹤必要狀態",
    intro:
      "題目開始要求你同時記住多筆資料或多個條件。先決定要保留哪些資訊，再依照題目順序更新，避免漏掉轉換時機。",
    focus: ["陣列與字串", "模擬與狀態", "複雜度估算"],
    checkpoint: "每處理一筆資料，都能說明目前狀態代表什麼。",
  },
  hard: {
    step: "03",
    title: "設計狀態，選擇有效率的方法",
    intro:
      "進階題要先找到能重複利用的子問題，或把大量可能性縮小。從狀態定義開始，檢查轉移順序、限制與數值範圍。",
    focus: ["動態規劃", "狀態轉移", "時間與記憶體限制"],
    checkpoint: "先估算方法的規模，再確認它能在限制內完成。",
  },
} as const;

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  // 一般使用者看不到課程裡未公開的題目
  const entries = course.problems.filter((cp) => isAdmin || cp.problem.isPublic);

  let joined = false;
  const solvedSet = new Set<number>();
  if (session) {
    const [membership, solved] = await Promise.all([
      prisma.courseMember.findUnique({
        where: {
          courseId_userId: { courseId, userId: session.userId },
        },
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
    for (const s of solved) solvedSet.add(s.problemId);
  }

  const total = entries.length;
  const solvedCount = entries.filter((e) => solvedSet.has(e.problemId)).length;
  const pct = total > 0 ? Math.round((solvedCount / total) * 100) : 0;
  const isApcsPath = course.title === "APCS 實作題：由簡到難";
  const difficultyGroups = [
    { key: "easy", label: "簡單" },
    { key: "medium", label: "中等" },
    { key: "hard", label: "困難" },
  ]
    .map((group) => {
      const groupEntries = entries.filter(
        (entry) => entry.problem.difficulty === group.key
      );
      return {
        ...group,
        entries: groupEntries,
        solved: groupEntries.filter((entry) =>
          solvedSet.has(entry.problemId)
        ).length,
      };
    })
    .filter((group) => group.entries.length > 0);

  // 課程排行：成員（或管理員）才看得到，只計課程內題目的解題數
  let board: { name: string; solved: number; subs: number }[] | null = null;
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
    for (const { userId } of acPairs) {
      solvedBy.set(userId, (solvedBy.get(userId) ?? 0) + 1);
    }
    const subsBy = new Map(subCounts.map((g) => [g.userId, g._count._all]));
    board = members
      .map((m) => ({
        name: m.user.displayName || m.user.username,
        solved: solvedBy.get(m.user.id) ?? 0,
        subs: subsBy.get(m.user.id) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.solved - a.solved || a.subs - b.subs || a.name.localeCompare(b.name)
      );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">{course.title}</h1>
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
        <p className="mono mt-1 text-xs text-mute">
          {total} 題 ・ {course._count.members} 位成員
          {course.joinCode && " ・ 需要加入代碼"}
          {isAdmin && course.joinCode && (
            <span className="ml-2 text-purple">代碼：{course.joinCode}</span>
          )}
        </p>
        {course.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-dim">
            {course.description}
          </p>
        )}
      </div>

      <div className="card flex flex-wrap items-center gap-5 p-5">
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
                  <span>解題進度</span>
                  <span className="mono">
                    {solvedCount} / {total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-inset">
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
      </div>

      {isApcsPath ? (
        <section aria-label="學習路徑" className="space-y-5">
          <div>
            <p className="mono text-xs uppercase tracking-[0.2em] text-mute">
              Learning path
            </p>
            <h2 className="section-title mt-1">三階段學習路徑</h2>
            <p className="mt-1 text-sm text-dim">
              先看每階段的學習重點，再依序完成題目；每階段 3 題，共 9 題。
            </p>
          </div>

          <nav className="grid gap-3 md:grid-cols-3" aria-label="跳至難度階段">
            {difficultyGroups.map((group) => {
              const guide = apcsLearningGuide[group.key as keyof typeof apcsLearningGuide];
              return (
                <Link
                  key={group.key}
                  href={`#${group.key}`}
                  className="card motion-card p-4 hover:bg-panel2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="mono text-xs text-mute">{guide.step} / 03</span>
                    <span className="mono text-xs text-mute">
                      {session
                        ? `${group.solved}/${group.entries.length} 完成`
                        : `${group.entries.length} 題`}
                    </span>
                  </div>
                  <h3 className="mt-2 font-semibold">{group.label}</h3>
                  <p className="mt-1 text-sm text-dim">{guide.title}</p>
                </Link>
              );
            })}
          </nav>

          {difficultyGroups.length === 0 ? (
            <div className="card p-10 text-center text-sm text-mute">
              這門課還沒有題目
            </div>
          ) : (
            difficultyGroups.map((group) => {
              const guide = apcsLearningGuide[group.key as keyof typeof apcsLearningGuide];
              return (
                <section
                  key={group.key}
                  id={group.key}
                  className="card scroll-mt-24 space-y-5 p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mono rounded-lg bg-inset px-3 py-2 text-lg font-semibold text-blue">
                        {guide.step}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="section-title">{group.label}</h3>
                          <span className="vbadge vbadge-gray">階段 {guide.step.slice(1)}</span>
                        </div>
                        <p className="mt-1 font-medium">{guide.title}</p>
                      </div>
                    </div>
                    <span className="mono text-sm text-mute">
                      {session
                        ? `${group.solved} / ${group.entries.length} 題完成`
                        : `${group.entries.length} 題練習`}
                    </span>
                  </div>

                  <p className="max-w-3xl text-sm leading-relaxed text-dim">
                    {guide.intro}
                  </p>

                  <div className="grid gap-4 rounded-lg bg-inset p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-semibold text-mute">這階段練習</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {guide.focus.map((focus) => (
                          <li key={focus} className="vbadge vbadge-blue">{focus}</li>
                        ))}
                      </ul>
                    </div>
                    <p className="max-w-sm text-sm text-dim">
                      <span className="font-semibold text-tx">解題提醒：</span>{guide.checkpoint}
                    </p>
                  </div>

                  <ol className="grid gap-2">
                    {group.entries.map((entry, index) => {
                      const isRecognition = entry.problem.type === "RECOGNITION";
                      const solved = solvedSet.has(entry.problemId);
                      return (
                        <li key={entry.id}>
                          <Link
                            href={
                              isRecognition
                                ? `/recognition/q/${entry.problem.id}`
                                : isApcsPath && entry.problem.problemCode && apcsCourseLessons[entry.problem.problemCode]
                                  ? `/courses/${course.id}/lessons/${entry.problem.problemCode}`
                                  : `/problems/${entry.problem.problemCode}`
                            }
                            className={`flex items-center gap-3 rounded-lg border border-bd p-3 transition-colors hover:bg-panel2 ${solved ? "row-solved" : ""}`}
                          >
                            <span className="mono flex size-9 shrink-0 items-center justify-center rounded-full bg-inset text-sm text-mute">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">{entry.problem.title}</span>
                              <span className="mono mt-0.5 block text-xs text-mute">
                                {entry.problem.problemCode ?? `題目 ${entry.problem.order}`}
                                {!entry.problem.isPublic && " ・ 未公開"}
                              </span>
                              {isApcsPath && entry.problem.problemCode && apcsCourseLessons[entry.problem.problemCode] && (
                                <span className="mt-1 block text-xs text-dim">
                                  {apcsCourseLessons[entry.problem.problemCode].concept}
                                </span>
                              )}
                            </span>
                            {solved ? (
                              <span className="vbadge vbadge-green">已完成</span>
                            ) : (
                              <span className="shrink-0 text-sm text-blue">{isApcsPath ? "開始教學 →" : "開始練習 →"}</span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })
          )}
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-head w-16">#</th>
                <th className="table-head">標題</th>
                <th className="table-head w-24">難度</th>
              </tr>
            </thead>
            {difficultyGroups.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={3} className="table-cell py-10 text-center text-mute">
                    這門課還沒有題目
                  </td>
                </tr>
              </tbody>
            ) : (
              difficultyGroups.map((group) => (
                <tbody key={group.key}>
                  <tr>
                    <td colSpan={3} className="table-cell bg-panel2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{group.label}</span>
                        <span className="mono text-xs text-mute">
                          {session
                            ? `${group.solved} / ${group.entries.length} 題完成`
                            : `${group.entries.length} 題`}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.entries.map((entry) => {
                    const isRecognition = entry.problem.type === "RECOGNITION";
                    return (
                      <tr
                        key={entry.id}
                        className={
                          solvedSet.has(entry.problemId)
                            ? "row-solved"
                            : "hover:bg-panel2"
                        }
                      >
                        <td className="table-cell text-dim">
                          {isRecognition
                            ? "選擇"
                            : (entry.problem.problemCode ?? entry.problem.order)}
                        </td>
                        <td className="table-cell">
                          <Link
                            href={
                              isRecognition
                                ? `/recognition/q/${entry.problem.id}`
                                : `/problems/${entry.problem.problemCode}`
                            }
                            className="font-medium text-blue hover:underline"
                          >
                            {entry.problem.title}
                          </Link>
                          {!entry.problem.isPublic && (
                            <span className="ml-2 text-xs text-mute">（未公開）</span>
                          )}
                        </td>
                        <td className="table-cell">
                          {isRecognition ? (
                            <span className="vbadge vbadge-blue">
                              {entry.problem.category ?? "選擇題"}
                            </span>
                          ) : (
                            <DifficultyBadge difficulty={entry.problem.difficulty} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              ))
            )}
          </table>
        </div>
      )}

      {board ? (
        <div>
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
                  <tr key={r.name} className="hover:bg-panel2">
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
        </div>
      ) : (
        session && (
          <p className="text-sm text-mute">加入課程後即可查看課程內部排行。</p>
        )
      )}
    </div>
  );
}
