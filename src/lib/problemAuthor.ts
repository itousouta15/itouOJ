import { prisma } from "@/lib/db";

// 題目表單送來的是出題者的使用者名稱（不是 id）。留空 = 不設定；
// 查無此人時回錯誤讓 API 擋下，避免默默把出題者設成 null。
export async function resolveAuthorId(
  username: string | undefined
): Promise<{ authorId: string | null } | { error: string }> {
  const name = username?.trim();
  if (!name) return { authorId: null };
  const user = await prisma.user.findUnique({
    where: { username: name },
    select: { id: true },
  });
  if (!user) return { error: `找不到使用者「${name}」` };
  return { authorId: user.id };
}
