import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { problemSchema } from "@/lib/problemSchema";

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = problemSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { testCases, ...fields } = parsed.data;

  const problem = await prisma.problem.create({
    data: {
      ...fields,
      testCases: {
        create: testCases.map((tc, i) => ({ ...tc, order: i + 1 })),
      },
    },
  });
  return Response.json({ id: problem.id });
}
