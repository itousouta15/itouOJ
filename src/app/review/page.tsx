import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/review");

  const [dueReviews, recentMisses] = await Promise.all([
    prisma.recognitionReview.findMany({
      where: { userId: session.userId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      take: 20,
      include: { problem: { select: { id: true, title: true } } },
    }),
    prisma.submission.findMany({
      where: { userId: session.userId, status: { in: ["WA", "TLE", "MLE", "RE", "CE"] } },
      orderBy: { id: "desc" },
      take: 10,
      select: { id: true, status: true, problem: { select: { order: true, title: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <p className="page-kicker">Review</p>
        <h1 className="page-title">Review queue</h1>
        <p className="mt-2 text-dim">Revisit recognition questions you previously missed.</p>
      </section>
      <section className="card divide-y divide-bd">
        {dueReviews.length === 0 ? (
          <p className="p-5 text-dim">Nothing is due right now. Nice work.</p>
        ) : (
          dueReviews.map((review) => (
            <Link key={review.id} href={`/recognition/q/${review.problem.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-panel2">
              <span className="font-medium text-blue">{review.problem.title}</span>
              <span className="text-sm text-dim">Review now</span>
            </Link>
          ))
        )}
      </section>
      {recentMisses.length > 0 && (
        <section>
          <h2 className="mb-3 section-title">Recent non-AC submissions</h2>
          <div className="card divide-y divide-bd">
            {recentMisses.map((submission) => (
              <Link key={submission.id} href={`/submissions/${submission.id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-panel2">
                <span>#{submission.problem.order} {submission.problem.title}</span>
                <span className="mono text-sm text-dim">{submission.status}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
