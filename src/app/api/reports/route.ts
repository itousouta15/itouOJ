import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { reportCreateSchema } from "@/lib/reportSchema";
import { listReports } from "@/lib/reportData";
import { readReportJson, reportErrorResponse } from "@/lib/reportRequest";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session)
    return Response.json({ error: "請先登入後回報" }, { status: 401 });
  const limited = enforceRateLimit(
    `bug-report:${session.userId}`,
    5,
    10 * 60_000,
  );
  if (limited) return limited;
  try {
    const parsed = reportCreateSchema.safeParse(await readReportJson(request));
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const report = await prisma.bugReport.create({
      data: { ...parsed.data, userId: session.userId },
      select: { id: true },
    });
    return Response.json(report, { status: 201 });
  } catch (error) {
    return reportErrorResponse(error);
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listReports(session, params), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
