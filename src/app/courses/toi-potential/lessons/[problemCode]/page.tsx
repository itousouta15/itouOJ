import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getToiPotentialCourseProblems } from "@/lib/toiPotentialCourseData";
import { toiPotentialTopics } from "@/lib/toiPotentialLessonTypes";
import ApcsLessonLab from "@/components/ApcsLessonLab";
import DifficultyBadge from "@/components/DifficultyBadge";
import { toiPotentialSourceIssues } from "@/lib/toiPotentialSourceIssues";

export const dynamic = "force-dynamic";

export default async function ToiPotentialLessonPage({
  params,
}: {
  params: Promise<{ problemCode: string }>;
}) {
  const { problemCode } = await params;
  const session = await getSession();
  const entries = await getToiPotentialCourseProblems(
    session?.role === "ADMIN",
  );
  const index = entries.findIndex((entry) => entry.problemCode === problemCode);
  if (index < 0) notFound();
  const current = entries[index];
  const { lesson } = current;
  const sourceIssue = toiPotentialSourceIssues[problemCode];
  const topic = toiPotentialTopics.find((unit) => unit.id === lesson.topic)!;
  const previous = entries[index - 1];
  const next = entries[index + 1];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <nav
        aria-label="麵包屑"
        className="flex flex-wrap items-center gap-2 text-sm text-mute"
      >
        <Link href="/courses/toi-potential" className="hover:text-blue">
          TOI 潛力組逐題教學
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/courses/toi-potential?topic=${lesson.topic}`}
          className="hover:text-blue"
        >
          {topic.title}
        </Link>
        <span aria-hidden="true">/</span>
        <span>
          第 {index + 1} / {entries.length} 課
        </span>
      </nav>
      <header className="card overflow-hidden">
        <div className="space-y-4 border-b border-bd p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-xs text-mute">
              {current.problemCode}
            </span>
            <DifficultyBadge difficulty={lesson.level} />
            <span className="vbadge vbadge-blue">{lesson.concept}</span>
            {!current.isPublic && (
              <span className="vbadge vbadge-gray">未公開</span>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {current.title}
          </h1>
          {sourceIssue && (
            <aside
              role="note"
              className="rounded-xl border border-amber/30 bg-amber/5 p-4"
            >
              <h2 className="font-semibold text-amber">
                {sourceIssue.title} · 非可提交解答
              </h2>
              <p className="mt-2 text-sm leading-7 text-dim">
                {sourceIssue.message}
              </p>
            </aside>
          )}
          <p className="max-w-3xl leading-7 text-dim">{lesson.goal}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/problems/${current.problemCode}`}
              className="btn-primary"
            >
              {sourceIssue ? "查看原題疑義 →" : "前往題目練習 →"}
            </Link>
            <span className="mono text-xs text-mute">{lesson.complexity}</span>
          </div>
        </div>
        <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2">
          <section>
            <h2 className="font-semibold">解題思路</h2>
            <div className="mt-3 space-y-3 text-sm leading-7 text-dim">
              {lesson.explanation.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
          <aside className="min-w-0 space-y-4 rounded-xl border border-amber/30 bg-amber/5 p-4">
            <div>
              <h2 className="font-semibold text-amber">常見陷阱</h2>
              <p className="mt-2 text-sm leading-7 text-dim">
                {lesson.pitfall}
              </p>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-lg bg-inset p-3">
                <p className="text-xs text-mute">範例輸入</p>
                <pre className="mt-2 max-h-64 overflow-auto font-mono text-xs leading-5">
                  {lesson.sampleInput}
                </pre>
              </div>
              <div className="min-w-0 rounded-lg bg-inset p-3">
                <p className="text-xs text-mute">預期輸出</p>
                <pre className="mt-2 max-h-64 overflow-auto font-mono text-xs leading-5">
                  {lesson.sampleOutput}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      </header>
      <ApcsLessonLab
        key={lesson.code}
        lesson={lesson}
        referenceNotice={sourceIssue?.message}
      />
      <nav aria-label="課程上一題下一題" className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            href={`/courses/toi-potential/lessons/${previous.problemCode}`}
            className="card p-4 hover:bg-panel2"
          >
            <span className="text-xs text-mute">← 上一課</span>
            <span className="mt-1 block">
              {previous.problemCode} · {previous.title}
            </span>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/courses/toi-potential/lessons/${next.problemCode}`}
            className="card p-4 hover:bg-panel2 sm:text-right"
          >
            <span className="text-xs text-mute">下一課 →</span>
            <span className="mt-1 block">
              {next.problemCode} · {next.title}
            </span>
          </Link>
        ) : (
          <Link
            href="/courses/toi-potential"
            className="card p-4 hover:bg-panel2 sm:text-right"
          >
            回到 TOI 潛力組學習路徑 →
          </Link>
        )}
      </nav>
    </main>
  );
}
