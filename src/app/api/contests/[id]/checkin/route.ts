import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getContestPhase, parseAllowedLanguages } from "@/lib/contest";

// 離線收件程式設定完成後回報「這台機器準備好了」。
//
// 斷網比賽開賽前，監考需要確認每一台選手機都登入好、選對比賽——漏掉一台，
// 那位選手整場都交不出東西，而且要到賽後上傳時才會發現。伺服器本身無從得知
// 客戶端的狀態，所以由客戶端主動回報。
const schema = z.object({
  // 回報的電腦名稱，方便對照是機房哪一台
  host: z.string().trim().max(100).optional(),
  // 收件程式版本號（例如 "1.2.11"）。開程式前雖然會自動更新，但沒網路、
  // 被防毒擋下時會失敗又不出聲——監考巡場靠這個欄位抓出還在跑舊版的機器。
  clientVersion: z.string().trim().max(20).optional(),
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

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  const host = parsed.success ? parsed.data.host : undefined;
  const clientVersion = parsed.success ? parsed.data.clientVersion : undefined;

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) {
    return Response.json({ error: "比賽不存在" }, { status: 404 });
  }

  const participant = await prisma.contestParticipant.findUnique({
    where: { contestId_userId: { contestId, userId: session.userId } },
  });

  // 沒報名照樣回 200，但明確標示出來。這是監考最需要知道的狀況之一：
  // 機器設定好了、人卻沒報名，提交時才會被擋。
  if (!participant) {
    return Response.json({
      ok: true,
      registered: false,
      warning: "尚未報名此比賽，提交會被拒絕",
      contest: {
        id: contest.id,
        title: contest.title,
        phase: getContestPhase(contest),
      },
    });
  }

  await prisma.contestParticipant.update({
    where: { id: participant.id },
    data: {
      clientReadyAt: new Date(),
      clientHost: host ?? null,
      clientVersion: clientVersion ?? null,
    },
  });

  return Response.json({
    ok: true,
    registered: true,
    contest: {
      id: contest.id,
      title: contest.title,
      phase: getContestPhase(contest),
      startTime: contest.startTime,
      endTime: contest.endTime,
      scoreMode: contest.scoreMode,
      allowedLanguages: parseAllowedLanguages(contest.allowedLanguages) ?? [],
    },
  });
}
