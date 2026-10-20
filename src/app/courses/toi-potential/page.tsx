import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getToiPotentialCourseProblems } from "@/lib/toiPotentialCourseData";
import { toiPotentialTopics } from "@/lib/toiPotentialLessonTypes";
import DifficultyBadge from "@/components/DifficultyBadge";
import { toiPotentialSourceIssues } from "@/lib/toiPotentialSourceIssues";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "TOI 潛力組逐題教學",
  description:
    "依主題與難度學習 TOI 潛力組題目，提供解題推導、步驟動畫與完整 C++、Python 程式。",
};

export default async function ToiPotentialCoursePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    topic?: string | string[];
    level?: string | string[];
  }>;
}) {
  const filters = await searchParams;
  const first = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const query = first(filters.q)?.trim() ?? "";
  const selectedTopic = first(filters.topic);
  const selectedLevel = first(filters.level);
  const topic = toiPotentialTopics.some((item) => item.id === selectedTopic)
    ? selectedTopic
    : "";
  const level = ["easy", "medium", "hard"].includes(selectedLevel ?? "")
    ? selectedLevel
    : "";
  const session = await getSession();
  const problems = await getToiPotentialCourseProblems(
    session?.role === "ADMIN",
  );
  const solved = session
    ? await prisma.submission.findMany({
        where: {
          userId: session.userId,
          status: "AC",
          problemId: { in: problems.map((item) => item.id) },
        },
        distinct: ["problemId"],
        select: { problemId: true },
      })
    : [];
  const solvedSet = new Set(solved.map((entry) => entry.problemId));
  const needle = query.toLocaleLowerCase();
  const filtered = problems.filter(
    (entry) =>
      (!topic || entry.lesson.topic === topic) &&
      (!level || entry.lesson.level === level) &&
      (!needle ||
        `${entry.problemCode} ${entry.title} ${entry.lesson.concept}`
          .toLocaleLowerCase()
          .includes(needle)),
  );
  const units = toiPotentialTopics
    .map((unit) => ({
      ...unit,
      entries: filtered.filter((entry) => entry.lesson.topic === unit.id),
    }))
    .filter((unit) => unit.entries.length > 0);
  const activeFilter = Boolean(query || topic || level);

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6">
      <header className="card space-y-3 p-5 sm:p-7">
        <Link href="/courses" className="text-sm text-mute hover:text-blue">
          ← 所有課程
        </Link>
        <p className="mono text-xs uppercase tracking-[0.2em] text-mute">
          TOI Potential · Guided practice
        </p>
        <h1 className="page-title">TOI 潛力組逐題教學</h1>
        <p className="max-w-3xl text-sm leading-7 text-dim">
          從基本統計與模擬走到二分、貪心、圖論及動態規劃。每題都附解題推導、常見陷阱、步驟動畫與完整
          C++ / Python 程式；建議先讀觀念、手算動畫，再到題目實作。
        </p>
        <p className="mono text-sm text-mute">
          {problems.length} 堂教學 · {toiPotentialTopics.length} 個主題 ·{" "}
          {session ? `${solvedSet.size} 題已完成` : "登入後以 AC 紀錄追蹤進度"}
        </p>
        <p className="text-xs text-mute">
          此為潛力組的獨立公開學習路徑，不需加入代碼，不影響新手組。難度依教學安排，不變更題庫原難度。
        </p>
        {problems.some(
          (problem) => toiPotentialSourceIssues[problem.problemCode],
        ) && (
          <p className="rounded-lg border border-amber/30 bg-amber/5 p-3 text-sm leading-6 text-dim">
            a344
            原題公式與範例矛盾，已標示「規格待釐清」，僅供觀念分析，不計為通過全部範例的解答。
          </p>
        )}
      </header>

      <form
        action="/courses/toi-potential"
        role="search"
        className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]"
      >
        <label className="min-w-0 text-sm text-dim">
          題號、名稱或方法
          <input
            key={query}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="例如 a108、入住旅館、二分"
            className="input mt-1 w-full"
          />
        </label>
        <label className="text-sm text-dim">
          主題
          <select
            key={topic}
            name="topic"
            defaultValue={topic}
            className="input mt-1 block w-full"
          >
            <option value="">全部主題</option>
            {toiPotentialTopics.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-dim">
          教學難度
          <select
            key={level}
            name="level"
            defaultValue={level}
            className="input mt-1 block w-full"
          >
            <option value="">全部難度</option>
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="btn-primary">
            篩選
          </button>
          {activeFilter && (
            <Link href="/courses/toi-potential" className="btn-secondary">
              清除
            </Link>
          )}
        </div>
      </form>

      <p role="status" className="text-sm text-mute">
        顯示 {filtered.length} / {problems.length}{" "}
        堂。每個主題內由簡單到困難排列，展開單元即可選課。
      </p>
      {units.length === 0 ? (
        <div className="card p-8 text-center text-dim">
          沒有符合的教學，請調整搜尋條件。
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <details
              key={unit.id}
              id={unit.id}
              open={activeFilter}
              className="card scroll-mt-24 overflow-hidden"
            >
              <summary className="cursor-pointer px-5 py-4 hover:bg-panel2">
                <span className="font-semibold">{unit.title}</span>
                <span className="mono ml-3 text-xs text-mute">
                  {unit.entries.length} 堂 ·{" "}
                  {
                    unit.entries.filter((entry) => solvedSet.has(entry.id))
                      .length
                  }{" "}
                  題已完成
                </span>
              </summary>
              <div className="space-y-4 border-t border-bd p-4 sm:p-5">
                <p className="text-sm text-dim">{unit.intro}</p>
                <ol className="grid gap-2 md:grid-cols-2">
                  {unit.entries.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        prefetch={false}
                        href={`/courses/toi-potential/lessons/${entry.problemCode}`}
                        className={`flex h-full items-start gap-3 rounded-lg border border-bd p-3 hover:bg-panel2 ${solvedSet.has(entry.id) ? "row-solved" : ""}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="mono block text-xs text-mute">
                            {entry.problemCode} ·{" "}
                            {toiPotentialSourceIssues[entry.problemCode]
                              ?.title ??
                              (solvedSet.has(entry.id) ? "已完成" : "開始教學")}
                            {!entry.isPublic ? " · 未公開" : ""}
                          </span>
                          <span className="mt-1 block font-medium">
                            {entry.title}
                          </span>
                          <span className="mt-1 block text-xs text-dim">
                            {entry.lesson.concept}
                          </span>
                        </span>
                        <DifficultyBadge difficulty={entry.lesson.level} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          ))}
        </div>
      )}
      <p className="text-center text-sm text-mute">
        <Link
          href="/problems?tag=TOI%20%E6%AD%B7%E5%B1%86"
          className="text-blue hover:underline"
        >
          回到 TOI 歷屆題庫
        </Link>{" "}
        · 公開範例通過不等於通過全部隱藏測資。
      </p>
    </main>
  );
}
