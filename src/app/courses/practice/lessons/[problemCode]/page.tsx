import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getNewProblemCourseProblems } from "@/lib/newProblemCourseData";
import { newProblemTopics } from "@/lib/newProblemLessons";
import ApcsLessonLab from "@/components/ApcsLessonLab";
import DifficultyBadge from "@/components/DifficultyBadge";
import ReportLink from "@/components/ReportLink";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ problemCode: string }> }): Promise<Metadata> {
  const { problemCode } = await params;
  const entries = await getNewProblemCourseProblems(false);
  const current = entries.find((entry) => entry.problemCode === problemCode);
  return current ? {
    title: `${problemCode} ${current.title}｜解題教學`,
    description: current.lesson.goal,
    alternates: { canonical: `/courses/practice/lessons/${problemCode}` },
  } : {};
}

export default async function PracticeLessonPage({ params }: { params: Promise<{ problemCode: string }> }) {
  const { problemCode } = await params;
  const session = await getSession();
  const entries = await getNewProblemCourseProblems(session?.role === "ADMIN");
  const index = entries.findIndex((entry) => entry.problemCode === problemCode);
  if (index < 0) notFound();
  const current = entries[index];
  const { lesson } = current;
  const topic = newProblemTopics.find((item) => item.id === lesson.topic)!;
  const previous = entries[index - 1];
  const next = entries[index + 1];
  return <main className="mx-auto w-full max-w-6xl space-y-6">
    <nav aria-label="麵包屑" className="flex flex-wrap items-center gap-2 text-sm text-mute">
      <Link href="/courses/practice" className="text-blue">競賽與專題逐題教學</Link><span>/</span>
      <Link href={`/courses/practice?topic=${lesson.topic}`}>{topic.title}</Link><span>/</span><span>第 {index + 1} / {entries.length} 課</span>
    </nav>
    <header className="card overflow-hidden">
      <div className="space-y-4 border-b border-bd p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2"><span className="mono text-xs text-mute">{current.problemCode}</span><DifficultyBadge difficulty={lesson.level} />{!current.isPublic && <span className="vbadge vbadge-gray">未公開</span>}</div>
        <h1 className="page-title">{current.title}</h1><p className="text-dim">{lesson.goal}</p>
        {lesson.performanceNote && <p role="note" className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-sm leading-7 text-dim"><strong className="text-amber">效能範圍：</strong>{lesson.performanceNote}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/problems/${current.problemCode}`} className="btn-primary">前往題目練習 →</Link>
          <ReportLink category="LESSON" section="EXPLANATION" title={`${current.problemCode} ${current.title}：教學問題`} context={`競賽與專題 · ${current.problemCode}`} label="回報教學錯誤" className="btn-secondary" />
        </div>
      </div>
      <div className="grid min-w-0 gap-5 p-5 sm:p-7 lg:grid-cols-2">
        <section className="space-y-3 text-sm leading-7 text-dim"><h2 className="section-title">解題思路</h2>{lesson.explanation.map((paragraph, i) => <p key={i}>{paragraph}</p>)}<p className="mono">{lesson.complexity}</p></section>
        <aside className="min-w-0 space-y-4 rounded-xl border border-amber/30 p-4">
          <div><h2 className="font-semibold text-amber">常見陷阱</h2><p className="mt-2 text-sm leading-7 text-dim">{lesson.pitfall}</p></div>
          {lesson.exampleKind === "constructed" && <p className="text-sm text-dim">此題未提供公開範例，以下為依題意計算並驗證的教學示例。</p>}
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            {[[lesson.exampleKind === "constructed" ? '教學示例輸入' : '範例輸入', lesson.sampleInput || '（無輸入）'], ['預期輸出', lesson.sampleOutput]].map(([title, text]) => <div key={title} className="min-w-0 rounded-lg bg-inset p-3"><p className="text-xs text-mute">{title}</p><pre className="mt-2 max-h-64 overflow-auto font-mono text-xs leading-5">{text}</pre></div>)}
          </div>
        </aside>
      </div>
    </header>
    <ApcsLessonLab key={lesson.code} lesson={lesson} />
    <nav aria-label="課程上一題下一題" className="grid gap-3 sm:grid-cols-2">
      {previous ? <Link href={`/courses/practice/lessons/${previous.problemCode}`} className="card p-4">← {previous.problemCode} · {previous.title}</Link> : <div />}
      {next ? <Link href={`/courses/practice/lessons/${next.problemCode}`} className="card p-4 sm:text-right">{next.problemCode} · {next.title} →</Link> : <Link href="/courses/practice" className="card p-4 sm:text-right">回到課程</Link>}
    </nav>
  </main>;
}
