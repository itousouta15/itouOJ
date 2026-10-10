import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../src/generated/prisma/client.ts";
import { createJudgeQueue } from "../../src/lib/judgeQueue.ts";

export async function judgeFixture(t, count = 1, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), "opencode", "itouoj-judge-"));
  const url = `file:${join(dir, "queue.db")}`;
  const sql = new Database(join(dir, "queue.db"));
  sql.pragma("journal_mode = WAL");
  sql.exec(`
    CREATE TABLE Problem (id INTEGER PRIMARY KEY, type TEXT NOT NULL DEFAULT 'PROGRAMMING',
      answerIndex INTEGER, timeLimitMs INTEGER NOT NULL DEFAULT 1000, memoryLimitMb INTEGER NOT NULL DEFAULT 256);
    CREATE TABLE Submission (
      id INTEGER PRIMARY KEY, userId TEXT NOT NULL, problemId INTEGER NOT NULL REFERENCES Problem(id),
      contestId INTEGER, language TEXT NOT NULL, code TEXT NOT NULL, selectedIndex INTEGER,
      status TEXT NOT NULL DEFAULT 'PENDING', compileError TEXT, timeMs INTEGER,
      memoryKb INTEGER, score INTEGER, clientKey TEXT, createdAt DATETIME NOT NULL,
      judgeClaimedAt DATETIME, judgeClaimId TEXT
    );
    CREATE INDEX Submission_status ON Submission(status);
    CREATE TABLE Subtask (id INTEGER PRIMARY KEY, problemId INTEGER NOT NULL REFERENCES Problem(id),
      "order" INTEGER NOT NULL, points INTEGER NOT NULL, checkMode TEXT NOT NULL DEFAULT 'full');
    CREATE TABLE TestCase (id INTEGER PRIMARY KEY, problemId INTEGER NOT NULL REFERENCES Problem(id),
      subtaskId INTEGER REFERENCES Subtask(id), "order" INTEGER NOT NULL DEFAULT 0,
      input TEXT NOT NULL, output TEXT NOT NULL);
    CREATE TABLE TestResult (
      id INTEGER PRIMARY KEY AUTOINCREMENT, submissionId INTEGER NOT NULL REFERENCES Submission(id),
      "order" INTEGER NOT NULL DEFAULT 0, subtaskOrder INTEGER, verdict TEXT NOT NULL,
      timeMs INTEGER, memoryKb INTEGER, testCaseId INTEGER REFERENCES TestCase(id), actualOutput TEXT
    );
    INSERT INTO Problem (id) VALUES (1);
    INSERT INTO TestCase (id,problemId,input,output) VALUES (1,1,'hidden-input','ok');
  `);
  for (let id = 1; id <= count; id++) sql.prepare(
    "INSERT INTO Submission (id,userId,problemId,language,code,createdAt) VALUES (?, 'test',1,'cpp',?,?)",
  ).run(id, `// submission ${id}`, new Date().toISOString());
  sql.close();
  const clients = Array.from({ length: 4 }, () => new PrismaClient({ adapter: new PrismaBetterSqlite3({ url, timeout: 50 }) }));
  let now = Date.now(), offset = 0;
  const queues = clients.map((db) => createJudgeQueue(db, () => new Date((options.realtime ? Date.now() : now) + offset), options.timing));
  t.after(async () => { await Promise.all(clients.map((db) => db.$disconnect())); await rm(dir, { recursive: true, force: true }); });
  return { db: clients[0], queues, url, advance: (ms) => { offset += ms; }, resetClock: () => { now = Date.now(); offset = 0; } };
}
