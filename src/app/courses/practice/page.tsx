import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getNewProblemCourseProblems } from "@/lib/newProblemCourseData";
import { newProblemTopics } from "@/lib/newProblemLessons";
import DifficultyBadge from "@/components/DifficultyBadge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "競賽與專題逐題教學" };

export default async function PracticeCoursePage({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; topic?: string | string[]; level?: string | string[] }>;
}) {
  const session = await getSession();
  const problems = await getNewProblemCourseProblems(session?.role === "ADMIN");
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const query = first(params.q).trim();
  const topic = first(params.topic);
  const level = first(params.level);
  const needle = query.toLocaleLowerCase();
  const filtered = problems.filter((entry) =>
    (!newProblemTopics.some((item) => item.id === topic) || entry.lesson.topic === topic)
    && (!["easy", "medium", "hard"].includes(level) || entry.lesson.level === level)
    && (!needle || `${entry.problemCode} ${entry.title} ${entry.lesson.concept}`.toLocaleLowerCase().includes(needle)));
  return <main className="mx-auto w-full max-w-6xl space-y-6">
    <Link href="/courses" className="text-sm text-blue hover:underline">← 所有課程</Link>
    <header className="space-y-3">
      <h1 className="page-title">競賽與專題逐題教學</h1>
      <p className="text-dim">依主題與難度練習，每題包含解題推導、動畫步驟、C++ 與 Python 程式。</p>
      <p className="mono text-sm text-mute">{problems.length} 題教學 · 符合條件 {filtered.length} 題</p>
    </header>
    <form className="card flex flex-wrap items-end gap-4 p-4" action="/courses/practice">
      <label className="min-w-48 flex-1 text-sm">題號、題名或方法
        <input name="q" defaultValue={query} placeholder="例如 b001、最短路" className="input mt-2 w-full" />
      </label>
      <label className="text-sm">主題
        <select name="topic" defaultValue={topic} className="input mt-2 block w-full">
          <option value="">所有主題</option>
          {newProblemTopics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <label className="text-sm">難度
        <select name="level" defaultValue={level} className="input mt-2 block w-full">
          <option value="">所有難度</option><option value="easy">簡單</option><option value="medium">中等</option><option value="hard">困難</option>
        </select>
      </label>
      <button className="btn-primary" type="submit">搜尋</button>
      <Link href="/courses/practice" className="btn-secondary">清除</Link>
    </form>
    {!filtered.length && <p className="card p-6 text-mute">沒有符合條件的教學，請調整搜尋條件。</p>}
    {newProblemTopics.map((unit) => {
      const entries = filtered.filter((entry) => entry.lesson.topic === unit.id);
      if (!entries.length) return null;
      return <section key={unit.id} className="space-y-3">
        <h2 className="section-title">{unit.title} <span className="text-sm text-mute">{entries.length} 題</span></h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => <Link key={entry.id} href={`/courses/practice/lessons/${entry.problemCode}`} className="card block space-y-2 p-4 hover:bg-panel2">
            <div className="flex flex-wrap items-center gap-2"><span className="mono text-xs text-mute">{entry.problemCode}</span><DifficultyBadge difficulty={entry.lesson.level} />{!entry.isPublic && <span className="vbadge vbadge-gray">未公開</span>}</div>
            <h3 className="font-semibold">{entry.title}</h3><p className="text-sm text-dim">{entry.lesson.concept}</p>
            {entry.lesson.performanceNote && <p className="text-xs text-amber">請先閱讀效能範圍</p>}
          </Link>)}
        </div>
      </section>;
    })}
  </main>;
}
