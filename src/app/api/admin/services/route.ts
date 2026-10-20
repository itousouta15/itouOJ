import { getSession } from "@/lib/auth";
import { createServiceAdminHandler, getManagedServices, manageService } from "@/lib/serviceAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = createServiceAdminHandler({ getSession, getStatus: getManagedServices, perform: manageService });
export const GET = handler;
export const POST = handler;
