import { getSession } from "@/lib/auth";
import { findReport } from "@/lib/reportData";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return Response.json({ error: "請先登入" }, { status: 401 });
  const report = await findReport(session, Number((await params).id));
  if (!report)
    return Response.json({ error: "找不到這筆回報" }, { status: 404 });
  return Response.json(report, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
