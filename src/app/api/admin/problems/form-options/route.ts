import { getSession } from "@/lib/auth";
import { problemFormOptions } from "@/lib/adminProblemData";

export async function GET() {
  if ((await getSession())?.role !== "ADMIN") {
    return Response.json({ error: "需要管理員權限" }, { status: 403 });
  }
  return Response.json(await problemFormOptions(), { headers: { "Cache-Control": "private, no-store" } });
}
