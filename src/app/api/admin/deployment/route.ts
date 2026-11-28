import { getSession } from "@/lib/auth";
import { createDeploymentAdminHandler, readDeployment } from "@/lib/deploymentAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handler = createDeploymentAdminHandler({ getSession,
  getStatus: () => readDeployment("GET"), start: () => readDeployment("POST") });
export const GET = handler;
export const POST = handler;
