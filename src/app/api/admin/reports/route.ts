import { getSession } from "@/lib/auth";
import { listReports } from "@/lib/reportData";

// 管理後台（itouOJ-admin）讀取全部錯誤回報（含篩選與分頁）。
export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  const params = Object.fromEntries(new URL(request.url).searchParams);
  return Response.json(await listReports(session, params, true), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
