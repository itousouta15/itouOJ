import { prisma } from "@/lib/db";
import { createHostRegistry } from "@/lib/hostRegistry";
import { createHostAgentHandler } from "@/lib/hostRoutes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const POST = createHostAgentHandler({ registry: createHostRegistry(prisma) });
