import { parentPort, workerData } from "node:worker_threads";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { createJudgeQueue } from "../../src/lib/judgeQueue.ts";
import { once } from "node:events";

const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: workerData.url }) });
try {
  parentPort.postMessage("ready");
  await once(parentPort, "message");
  parentPort.postMessage(await createJudgeQueue(db).claim());
  if (workerData.hold) await once(parentPort, "message");
}
finally { await db.$disconnect(); }
