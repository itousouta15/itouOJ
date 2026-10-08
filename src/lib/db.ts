import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  // Regeneration replaces the constructor during dev HMR. Reusing an older
  // instance would retain stale model metadata and reject newly added fields.
  (globalForPrisma.prisma instanceof PrismaClient ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    adapter: new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? "file:./prisma/data/dev.db",
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
