import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getActivityFeed } from "@/lib/activityFeed";
import FeedList from "@/components/FeedList";
import FollowButton from "@/components/FollowButton";

export const metadata: Metadata = {
  title: "動態",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/activity");

  const followingRows = await prisma.follow.findMany({
    where: { followerId: session.userId },
    select: { followingId: true },
  });
  const followingIds = followingRows.map((f) => f.followingId);

  // 有追蹤人只看追蹤對象；還沒追蹤就顯示全站最新動態，另外給推薦名單。
  const feed = await getActivityFeed(
    followingIds.length > 0 ? followingIds : null,
    50
  );

  let recommended: {
    username: string;
    displayName: string | null;
    solved: number;
  }[] = [];
  if (followingIds.length === 0) {
    const acPairs = await prisma.submission.findMany({
      where: { status: "AC", userId: { not: session.userId } },
      distinct: ["userId", "problemId"],
      select: { userId: true },
    });
    const solvedByUser = new Map<string, number>();
    for (const { userId } of acPairs) {
      solvedByUser.set(userId, (solvedByUser.get(userId) ?? 0) + 1);
    }
    const topIds = [...solvedByUser.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const users = await prisma.user.findMany({
      where: { id: { in: topIds } },
      select: { id: true, username: true, displayName: true },
    });
    recommended = users
      .map((u) => ({
        username: u.username,
        displayName: u.displayName,
        solved: solvedByUser.get(u.id) ?? 0,
      }))
      .sort((a, b) => b.solved - a.solved);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="page-title">動態</h1>
        <p className="mt-1 text-sm text-dim">
          {followingIds.length > 0
            ? "你追蹤的人最近的 AC、題解與留言。"
            : "還沒追蹤任何人，先看看全站動態。"}
        </p>
      </div>

      {followingIds.length === 0 && (
        <section className="card p-6">
          <h2 className="section-title">推薦追蹤</h2>
          {recommended.length === 0 ? (
            <p className="mt-2 text-sm text-mute">
              還沒有人解出題目，去
              <Link
                href="/problems"
                className="mx-1 text-blue hover:underline"
              >
                題目列表
              </Link>
              逛逛吧。
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {recommended.map((r) => (
                <div
                  key={r.username}
                  className="flex items-center gap-3 rounded-lg bg-inset px-3 py-2"
                >
                  <Link
                    href={`/users/${r.username}`}
                    className="min-w-0 flex-1 truncate text-sm font-medium text-blue hover:underline"
                  >
                    {r.displayName || r.username}
                  </Link>
                  <span className="mono shrink-0 text-xs text-dim">
                    {r.solved} 題
                  </span>
                  <FollowButton username={r.username} initialFollowing={false} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <FeedList items={feed} />
    </div>
  );
}
