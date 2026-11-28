import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 30;

// 題目列表的標籤篩選：依關鍵字即時查詢，一次最多 30 筆。
// 取代過去把全部標籤（數千筆）塞進頁面的做法。只列出「有掛在可見實作題上」的標籤。
export async function GET(request: Request) {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 50);

  const tags = await prisma.tag.findMany({
    where: {
      ...(q ? { name: { contains: q } } : {}),
      problems: {
        some: { problem: { type: "PROGRAMMING", ...(isAdmin ? {} : { isPublic: true }) } },
      },
    },
    orderBy: { name: "asc" },
    take: MAX_RESULTS,
    select: { name: true },
  });

  return Response.json(
    { tags: tags.map((t) => t.name) },
    // private：管理員看得到未公開題的標籤，不能被共用快取。
    { headers: { "Cache-Control": "private, max-age=60" } },
  );
}
