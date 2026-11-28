import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { tagSchema } from "@/lib/tagSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const existing = await prisma.tag.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return Response.json({ error: "已經有這個標籤了" }, { status: 400 });
  }

  const tag = await prisma.tag.create({ data: parsed.data });
  return Response.json({ id: tag.id, name: tag.name });
}
