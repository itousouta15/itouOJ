import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createHostRegistry } from "@/lib/hostRegistry";
import { createHostAdminHandler } from "@/lib/hostRoutes";
import { getManagedServices } from "@/lib/serviceAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handler = createHostAdminHandler({ getSession, registry: createHostRegistry(prisma), getLocalServices: getManagedServices });
export const GET = handler;
export const POST = handler;
