import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { enqueueSubmission } from "@/lib/judge";
import { LANGUAGE_KEYS } from "@/lib/languages";
import {
  getContestPhase,
  parseAllowedLanguages,
  languageLabels,
} from "@/lib/contest";

// 斷網比賽的整批上傳：比賽期間選手機沒有網路，收件程式只把程式碼存在本機，
// 等重新連網後一次送上來。跟 /api/submissions 分開的原因有兩個：
//   1. assertContestProblemAccess 在比賽結束後會擋掉所有非管理員的提交
//   2. 這裡必須採用選手當下按提交的時間，而不是 now()，否則罰時/用時全錯
const schema = z.object({
  submissions: z
    .array(
      z.object({
        // 收件程式為每筆提交產生的去重鍵，選手重複按上傳時用它擋掉重複寫入
        clientKey: z.string().min(1).max(100),
        problemId: z.number().int().positive(),
        language: z.enum(LANGUAGE_KEYS as [string, ...string[]]),
        code: z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長"),
        submittedAt: z.coerce.date(),
      })
    )
    .min(1, "沒有要上傳的提交")
    .max(100, "一次最多上傳 100 筆"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "請先登入" }, { status: 401 });
  }

  const { id } = await params;
  const contestId = Number(id);
  if (!Number.isInteger(contestId)) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: { problems: { select: { problemId: true } } },
  });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const isAdmin = session.role === "ADMIN";
  if (!isAdmin) {
    const participant = await prisma.contestParticipant.findUnique({
      where: { contestId_userId: { contestId, userId: session.userId } },
    });
    if (!participant) {
      return Response.json({ error: "尚未報名此比賽" }, { status: 403 });
    }
  }

  // 比賽還沒開始就沒有東西好上傳；結束後才上傳正是這條路存在的目的，所以不擋
  if (getContestPhase(contest) === "upcoming") {
    return Response.json({ error: "比賽尚未開始" }, { status: 403 });
  }

  const contestProblemIds = new Set(contest.problems.map((p) => p.problemId));
  const invalid = parsed.data.submissions.find(
    (s) => !contestProblemIds.has(s.problemId)
  );
  if (invalid) {
    return Response.json(
      { error: `題目 ${invalid.problemId} 不屬於本比賽` },
      { status: 400 }
    );
  }

  // 收件程式也會擋，但那是選手機器上的檢查，擋不住改過的用戶端
  const allowed = parseAllowedLanguages(contest.allowedLanguages);
  if (allowed) {
    const badLang = parsed.data.submissions.find(
      (s) => !allowed.includes(s.language)
    );
    if (badLang) {
      return Response.json(
        { error: `本比賽只開放 ${languageLabels(allowed)}` },
        { status: 400 }
      );
    }
  }

  // 時間戳是選手機器給的，理論上可以被竄改。夾制在比賽區間內擋掉最離譜的情況
  // （賽前寫好、賽後補交都會被拉回邊界）；區間內的微調擋不住，要靠監考。
  const startMs = contest.startTime.getTime();
  const endMs = contest.endTime.getTime();
  const clamp = (at: Date) =>
    new Date(Math.min(Math.max(at.getTime(), startMs), endMs));

  // 依提交時間排序後寫入，讓自增 id 的順序和時間順序一致；
  // 夾制後若有多筆撞到同一個邊界時間，計分板才能用 id 穩定決定「最後一次」。
  const incoming = [...parsed.data.submissions].sort(
    (a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()
  );

  const accepted: number[] = [];
  let duplicates = 0;

  for (const s of incoming) {
    // 用 userId 當前綴，避免有人拿別人的 clientKey 來讓對方的提交被當成重複而消失
    const clientKey = `${session.userId}:${s.clientKey}`;

    const existing = await prisma.submission.findUnique({
      where: { clientKey },
      select: { id: true },
    });
    if (existing) {
      duplicates++;
      continue;
    }

    const created = await prisma.submission.create({
      data: {
        userId: session.userId,
        problemId: s.problemId,
        contestId,
        language: s.language,
        code: s.code,
        status: "PENDING",
        clientKey,
        createdAt: clamp(s.submittedAt),
      },
      select: { id: true },
    });
    accepted.push(created.id);
  }

  for (const submissionId of accepted) enqueueSubmission(submissionId);

  return Response.json({
    accepted: accepted.length,
    duplicates,
    total: incoming.length,
    submissionIds: accepted,
  });
}
