import { getSession } from "@/lib/auth";
import { createServiceLogsHandler } from "@/lib/serviceLogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createServiceLogsHandler(getSession);
