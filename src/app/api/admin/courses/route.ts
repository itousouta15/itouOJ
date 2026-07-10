import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { courseSchema } from "@/lib/courseSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = courseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { problemIds, joinCode, ...fields } = parsed.data;

  const course = await prisma.course.create({
    data: {
      ...fields,
      joinCode: joinCode || null,
      problems: {
        create: problemIds.map((problemId, i) => ({
          problemId,
          order: i + 1,
        })),
      },
    },
  });
  return Response.json({ id: course.id });
}
