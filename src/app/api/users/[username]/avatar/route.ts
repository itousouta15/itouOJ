import { prisma } from "@/lib/db";

// 本地上傳的頭像。網址會帶 ?v=avatarUpdatedAt，內容改了網址一定跟著變，
// 所以可以放心長快取。
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { avatarData: true, avatarMime: true, avatarUpdatedAt: true },
  });
  if (!user?.avatarData || !user.avatarMime) {
    return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(user.avatarData), {
    headers: {
      "Content-Type": user.avatarMime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
