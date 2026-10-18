import Link from "next/link";
import { notFound } from "next/navigation";
import ApcsLessonLab from "@/components/ApcsLessonLab";
import DifficultyBadge from "@/components/DifficultyBadge";
import { apcsCourseLessons } from "@/lib/apcsCourseLessons";
import { getToiTopicForProblem } from "@/lib/toiCourseCurriculum";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ApcsLessonPage({
  params,
}: {
  params: Promise<{ id: string; problemCode: string }>;
}) {
  const { id, problemCode } = await params;
  const courseId = Number(id);
  const toiTopic = getToiTopicForProblem(problemCode);
  const lesson = apcsCourseLessons[problemCode] ?? toiTopic?.lesson;
  if (!Number.isInteger(courseId) || !lesson) notFound();

  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      problems: {
        orderBy: [{ order: "asc" }, { id: "asc" }],
        select: {
          problemId: true,
          problem: { select: { id: true, problemCode: true, title: true, difficulty: true, isPublic: true } },
        },
      },
    },
  });
  const isApcsPath = course?.title === "APCS 實作題：由簡到難";
  const isToiCourse = course?.title === "TOI 新手組 練習";
  if (!course || (!isApcsPath && !isToiCourse) || (!course.isPublic && !isAdmin) || (isApcsPath && !apcsCourseLessons[problemCode]) || (isToiCourse && !toiTopic)) notFound();

  const entries = course.problems.filter((entry) => isAdmin || entry.problem.isPublic);
  const currentIndex = entries.findIndex((entry) => entry.problem.problemCode === problemCode);
  if (currentIndex < 0) notFound();
  const current = entries[currentIndex].problem;
  const previous = entries[currentIndex - 1]?.problem;
  const next = entries[currentIndex + 1]?.problem;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm text-mute">
        <Link href={`/courses/${courseId}`} className="hover:text-blue">{isToiCourse ? "TOI 新手組" : "APCS 由簡到難"}</Link>
        <span aria-hidden="true">/</span>
        <span>第 {currentIndex + 1} / {entries.length} 課</span>
      </nav>

      <header className="card overflow-hidden">
        <div className="border-b border-bd p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono rounded-md bg-inset px-2 py-1 text-xs text-mute">{current.problemCode}</span>
            <DifficultyBadge difficulty={current.difficulty} />
            <span className="vbadge vbadge-blue">{isToiCourse ? toiTopic?.title : lesson.concept}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{current.title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-dim">{lesson.goal}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/problems/${current.problemCode}`} className="btn-primary">前往題目練習 →</Link>
            <span className="self-center mono text-xs text-mute">{lesson.complexity}</span>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <div>
            <h2 className="font-semibold">這題在學什麼</h2>
            <div className="mt-2 space-y-3 text-sm leading-6 text-dim">
              {lesson.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <aside className="rounded-xl border border-amber/30 bg-amber/5 p-4">
            <h2 className="font-semibold text-amber">常見陷阱</h2>
            <p className="mt-2 text-sm leading-6 text-dim">{lesson.pitfall}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-inset p-3">
                <p className="text-xs text-mute">範例輸入</p>
                <pre className="mt-1 overflow-x-auto font-mono text-xs leading-5">{lesson.sampleInput}</pre>
              </div>
              <div className="rounded-lg bg-inset p-3">
                <p className="text-xs text-mute">預期輸出</p>
                <pre className="mt-1 overflow-x-auto font-mono text-xs leading-5">{lesson.sampleOutput}</pre>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <ApcsLessonLab lesson={lesson} />

      <nav aria-label="課程上一題下一題" className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link href={`/courses/${courseId}/lessons/${previous.problemCode}`} className="card p-4 transition-colors hover:bg-panel2">
            <span className="text-xs text-mute">← 上一課</span>
            <span className="mt-1 block font-semibold">{previous.problemCode}・{previous.title}</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link href={`/courses/${courseId}/lessons/${next.problemCode}`} className="card p-4 text-left transition-colors hover:bg-panel2 sm:text-right">
            <span className="text-xs text-mute">下一課 →</span>
            <span className="mt-1 block font-semibold">{next.problemCode}・{next.title}</span>
          </Link>
        ) : (
          <Link href={`/problems/${current.problemCode}`} className="card p-4 text-left transition-colors hover:bg-panel2 sm:text-right">
            <span className="text-xs text-mute">最後一課完成了</span>
            <span className="mt-1 block font-semibold">開始提交解答 →</span>
          </Link>
        )}
      </nav>
      <div className="text-center">
        <Link href={`/courses/${courseId}`} className="text-sm text-blue hover:underline">回到完整學習路徑</Link>
      </div>
    </main>
  );
}
