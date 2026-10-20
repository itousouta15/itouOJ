import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth";
import { reportFilters, type ReportSearchParams } from "@/lib/reportSchema";

export async function listReports(
  session: Session,
  params: ReportSearchParams = {},
  adminView = false,
) {
  const filters = reportFilters(params);
  const where = {
    ...(adminView && session.role === "ADMIN"
      ? {}
      : { userId: session.userId }),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.query
      ? {
          OR: [
            { title: { contains: filters.query } },
            { sourcePath: { contains: filters.query } },
          ],
        }
      : {}),
  };
  const [total, reports] = await prisma.$transaction([
    prisma.bugReport.count({ where }),
    prisma.bugReport.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * 20,
      take: 20,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        reporter: { select: { username: true, displayName: true } },
      },
    }),
  ]);
  return { reports, total, filters };
}

export async function findReport(session: Session, id: number) {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return prisma.bugReport.findFirst({
    where: {
      id,
      ...(session.role === "ADMIN" ? {} : { userId: session.userId }),
    },
    include: { reporter: { select: { username: true, displayName: true } } },
  });
}
