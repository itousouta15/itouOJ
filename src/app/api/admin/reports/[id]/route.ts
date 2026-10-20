import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rateLimit";
import { reportUpdateSchema } from "@/lib/reportSchema";
import { readReportJson, reportErrorResponse } from "@/lib/reportRequest";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return Response.json({ error: "找不到這筆回報" }, { status: 404 });
  const limited = enforceRateLimit(
    `bug-report-admin:${session.userId}`,
    60,
    60_000,
  );
  if (limited) return limited;
  try {
    const parsed = reportUpdateSchema.safeParse(await readReportJson(request));
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    const { status, adminReply, expectedUpdatedAt } = parsed.data;
    const existing = await prisma.bugReport.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing)
      return Response.json({ error: "找不到這筆回報" }, { status: 404 });
    const updated = await prisma.bugReport.updateMany({
      where: { id, updatedAt: new Date(expectedUpdatedAt) },
      data: {
        status,
        adminReply,
        // Always advance the version timestamp, even for updates in one millisecond.
        updatedAt: new Date(
          Math.max(Date.now(), Date.parse(expectedUpdatedAt) + 1),
        ),
      },
    });
    if (!updated.count)
      return Response.json(
        { error: "回報已被更新，請重新整理後再處理" },
        { status: 409 },
      );
    return Response.json({ ok: true });
  } catch (error) {
    return reportErrorResponse(error);
  }
}
