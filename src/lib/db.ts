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

// better-sqlite3 is synchronous, so the pragmas below directly cut the time the
// event loop stays blocked. journal_mode=WAL persists in the DB file; the others
// are per-connection and apply to the adapter's connection.
const globalForPragmas = globalThis as unknown as { prismaPragmasApplied?: boolean };
if (
  !globalForPragmas.prismaPragmasApplied &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  globalForPragmas.prismaPragmasApplied = true;
  void (async () => {
    try {
      await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
      await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL");
      await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000");
      await prisma.$queryRawUnsafe("PRAGMA cache_size = -65536"); // 64 MiB
      await prisma.$queryRawUnsafe("PRAGMA temp_store = MEMORY");
      await prisma.$queryRawUnsafe("PRAGMA mmap_size = 268435456"); // 256 MiB
    } catch (error) {
      globalForPragmas.prismaPragmasApplied = false;
      console.warn("[db] failed to apply SQLite pragmas", error);
    }
  })();
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
