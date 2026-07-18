import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase } from "@/lib/contest";
import ContestStatusBadge from "@/components/ContestStatusBadge";

export const metadata: Metadata = { title: "比賽" };
export const dynamic = "force-dynamic";

export default async function ContestsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const contests = await prisma.contest.findMany({
    where: isAdmin ? {} : { isPublic: true },
    orderBy: { startTime: "desc" },
    include: { _count: { select: { problems: true, participants: true } } },
  });

  const running = contests.filter((c) => getContestPhase(c) === "running" || getContestPhase(c) === "frozen");
  const upcoming = contests.filter((c) => getContestPhase(c) === "upcoming");
  const ended = contests.filter((c) => getContestPhase(c) === "ended");

  const sections: { title: string; items: typeof contests }[] = [
    { title: "進行中", items: running },
    { title: "即將開始", items: upcoming },
    { title: "已結束", items: ended },
  ];

  return (
    <div className="space-y-8">
      <h1 className="page-title">比賽</h1>
      {contests.length === 0 && (
        <p className="text-sm text-mute">還沒有比賽</p>
      )}
      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.title}>
              <h2 className="section-title mb-3">{section.title}</h2>
              <div className="space-y-2">
                {section.items.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contests/${c.id}`}
                    className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-panel2"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{c.title}</span>
                        <ContestStatusBadge contest={c} />
                        {!c.isPublic && <span className="vbadge vbadge-gray">未公開</span>}
                      </div>
                      <p className="mono mt-1 text-xs text-mute">
                        {c.startTime.toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                          hour12: false,
                        })}{" "}
                        →{" "}
                        {c.endTime.toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                          hour12: false,
                        })}
                      </p>
                    </div>
                    <p className="mono text-xs text-mute">
                      {c._count.problems} 題 ・ {c._count.participants} 位參賽者
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
