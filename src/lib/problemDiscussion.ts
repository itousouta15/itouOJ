import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth";

// 這題目前還被某場「尚未結束」的比賽用到嗎？
//
// 條件是「有任何一場 endTime 還沒到的比賽用到這題」，所以 upcoming / running /
// frozen 三種狀態都算。為什麼連還沒開始的比賽也要鎖：比賽兩點開始、選手一點鐘
// 把討論區的提示讀完，跟賽中偷看沒有差別——這跟 api/contests/[id]/problems
// 開賽前不給題目內容是同一個考量。
export async function isProblemLockedByContest(
  problemId: number
): Promise<boolean> {
  const count = await prisma.contestProblem.count({
    where: { problemId, contest: { endTime: { gt: new Date() } } },
  });
  return count > 0;
}

// 這位使用者「解出」這一題了嗎？
//
// 定義刻意跟計分板完全一致（Submission.status === "AC"，見 lib/contest.ts 的
// buildScoreboard），也就是全部測資都對才算，子題拿部分分數不算解出來。
// 兩邊共用同一套標準，才不會出現「計分板說我沒解出來、題解區卻讓我看」的矛盾。
export async function hasSolvedProblem(
  userId: string,
  problemId: number
): Promise<boolean> {
  const count = await prisma.submission.count({
    where: { userId, problemId, status: "AC" },
  });
  return count > 0;
}

export interface DiscussionAccess {
  // 整個討論區顯不顯示。比賽進行中（含賽前）對一般使用者整區隱藏。
  visible: boolean;
  // 能不能發留言／回覆
  canComment: boolean;
  // 看不看得到別人的題解。題解一定直接洩題，所以要先自己 AC 過。
  canViewSolutions: boolean;
  // 能不能發題解。沒解出來的人不該有東西可以分享，跟能不能看用同一個條件。
  canPostSolution: boolean;
  // 給前端顯示「為什麼看不到」用，不是權限判斷本身
  lockedByContest: boolean;
  solved: boolean;
}

// 討論區的權限一次算完。放在同一支函式裡是刻意的——留言、題解、發文三種
// 權限彼此有關聯（例如比賽鎖住時全部都要關掉），拆開判斷很容易漏掉一種組合。
export async function getDiscussionAccess(
  session: Session | null,
  problemId: number
): Promise<DiscussionAccess> {
  const isAdmin = session?.role === "ADMIN";

  // 管理員要能在比賽期間檢查討論區內容（例如確認沒有人賽前偷貼提示），
  // 所以不受比賽鎖與 AC 限制。
  if (isAdmin) {
    return {
      visible: true,
      canComment: true,
      canViewSolutions: true,
      canPostSolution: true,
      lockedByContest: await isProblemLockedByContest(problemId),
      solved: true,
    };
  }

  const lockedByContest = await isProblemLockedByContest(problemId);
  if (lockedByContest) {
    return {
      visible: false,
      canComment: false,
      canViewSolutions: false,
      canPostSolution: false,
      lockedByContest: true,
      solved: false,
    };
  }

  const solved = session
    ? await hasSolvedProblem(session.userId, problemId)
    : false;

  return {
    visible: true,
    canComment: !!session,
    canViewSolutions: solved,
    canPostSolution: solved,
    lockedByContest: false,
    solved,
  };
}
