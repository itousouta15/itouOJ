import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Database from "better-sqlite3";
import { cpeLessons } from "../src/lib/cpeLessons.ts";

const seed = JSON.parse(
  await readFile(
    new URL(
      "../prisma/seed-data/recognition/apcs-2016-03.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const legacy = JSON.parse(
  await readFile(
    new URL("./fixtures/tutorial-explanation-legacy.json", import.meta.url),
    "utf8",
  ),
);
const migrationName = "20261022000000_correct_tutorial_explanations";
const migrationsRoot = new URL("../prisma/migrations/", import.meta.url);
const migration = await readFile(
  new URL(`${migrationName}/migration.sql`, migrationsRoot),
  "utf8",
);
const earlierMigrations = await Promise.all(
  (await readdir(migrationsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name < migrationName)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) =>
      readFile(new URL(`${entry.name}/migration.sql`, migrationsRoot), "utf8"),
    ),
);
const question = (number) =>
  seed.questions.find((entry) => entry.number === number);

function database(t) {
  // Never read DATABASE_URL or a developer/production database.
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.pragma("foreign_keys = ON");
  for (const sql of earlierMigrations) db.exec(sql);
  return db;
}

function insert(db, number, overrides = {}) {
  const q = question(number);
  const row = {
    title: `${seed.source} 第 ${number} 題`,
    statement: q.question.trim(),
    type: "RECOGNITION",
    code: q.code,
    options: JSON.stringify(q.options.map((option) => option.trim())),
    answerIndex: q.answerIndex,
    explanation: legacy.explanations[number],
    sourceNumber: number,
    category: q.category,
    order: db.prepare("SELECT COUNT(*) AS n FROM Problem").get().n + 100,
    ...overrides,
  };
  return Number(
    db
      .prepare(
        `INSERT INTO Problem
      (title, statement, type, code, options, answerIndex, explanation, sourceNumber, category, "order")
      VALUES (@title, @statement, @type, @code, @options, @answerIndex, @explanation, @sourceNumber, @category, @order)`,
      )
      .run(row).lastInsertRowid,
  );
}

test("legacy explanations migrate without changing identity, answers or learner progress", (t) => {
  const db = database(t);
  db.prepare(
    "INSERT INTO User (id, username, passwordHash) VALUES ('learner', 'learner', 'unused-test-hash')",
  ).run();
  // Deliberately do not rely on production IDs 47 and 49.
  const ids = [6, 13].map((number) => insert(db, number));
  for (const [index, id] of ids.entries()) {
    db.prepare(
      `INSERT INTO RecognitionAnswer (userId, problemId, selectedIndex, isCorrect, updatedAt)
      VALUES ('learner', ?, ?, 1, CURRENT_TIMESTAMP)`,
    ).run(id, question([6, 13][index]).answerIndex);
  }
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  const progress = db
    .prepare("SELECT * FROM RecognitionAnswer ORDER BY id")
    .all();
  db.exec(migration);
  const after = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  assert.deepEqual(
    after,
    before.map((row, index) => ({
      ...row,
      explanation: question([6, 13][index]).explanation,
    })),
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM RecognitionAnswer ORDER BY id").all(),
    progress,
  );
  const changes = db.prepare("SELECT total_changes() AS n").get().n;
  db.exec(migration);
  assert.equal(db.prepare("SELECT total_changes() AS n").get().n, changes);
});

test("migration also matches legacy JSON data from a CRLF SQL checkout", (t) => {
  const db = database(t);
  const ids = [6, 13].map((number) => insert(db, number));
  db.exec(migration.replace(/\r?\n/g, "\r\n"));
  assert.deepEqual(
    ids.map(
      (id) =>
        db.prepare("SELECT explanation FROM Problem WHERE id = ?").get(id)
          .explanation,
    ),
    [question(6).explanation, question(13).explanation],
  );
});

test("migration preserves custom explanations and edited question content", (t) => {
  const db = database(t);
  for (const number of [6, 13]) {
    const q = question(number);
    for (const override of [
      { explanation: "管理員自訂解析" },
      { explanation: null },
      { explanation: q.explanation },
      { code: q.code + "\n// edited" },
      { statement: q.question + "\n自訂題意" },
      { options: JSON.stringify(["custom", "options"]) },
      { answerIndex: 1 - q.answerIndex },
      { sourceNumber: 99 },
      { title: "另一個同名程式碼練習" },
      { type: "PROGRAMMING" },
    ])
      insert(db, number, override);
  }
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  db.exec(migration);
  assert.deepEqual(
    db.prepare("SELECT * FROM Problem ORDER BY id").all(),
    before,
  );
});

test("fresh installs and corrected seed imports are safe", (t) => {
  const db = database(t);
  db.exec(migration);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Problem").get().n, 0);
  const ids = [6, 13].map((number) =>
    insert(db, number, { explanation: question(number).explanation }),
  );
  db.exec(migration);
  assert.deepEqual(
    ids.map(
      (id) =>
        db.prepare("SELECT explanation FROM Problem WHERE id = ?").get(id)
          .explanation,
    ),
    [question(6).explanation, question(13).explanation],
  );
  assert.equal(question(6).answerIndex, 1);
  assert.equal(question(13).answerIndex, 0);
});

test("a663 trace transfers from underpayers to overpayers and conserves money", () => {
  const lesson = cpeLessons.a663;
  const initial = lesson.trace[0].cells.map(Number);
  const final = lesson.trace.at(-1);
  const target = final.cells.map(Number);
  const variables = Object.fromEntries(final.variables);
  const paid = [
    Number(variables["再付（原付300）"]),
    Number(variables["再付（原付301）"]),
  ];
  const refunded = [
    Number(variables["收回（原付1500）"]),
    Number(variables["收回（原付1501）"]),
  ];
  assert.deepEqual(initial, [1500, 1501, 300, 301]);
  assert.deepEqual(target, [901, 901, 900, 900]);
  assert.deepEqual(
    initial.map((value, i) => value + (i < 2 ? -refunded[i] : paid[i - 2])),
    target,
  );
  assert.equal(paid[0] + paid[1], 1199);
  assert.equal(refunded[0] + refunded[1], 1199);
  assert.equal(variables["答案"], "$11.99");
  assert.match(final.description, /少付者補款給多付者/);
  assert.match(lesson.explanation[0], /至少應獲補償/);
  assert.doesNotMatch(lesson.explanation.join("\n"), /至少須交出/);
});

test(
  "corrected recognition snippets and a663 programs execute with independent oracles",
  {
    skip:
      process.platform === "win32"
        ? "Execute Linux binaries using the WSL verification helper, not Windows .exe files."
        : false,
  },
  () => {
    const result = spawnSync(
      "python3",
      [
        fileURLToPath(
          new URL(
            "./lib/check-tutorial-explanation-corrections.py",
            import.meta.url,
          ),
        ),
        "--cxx",
        "g++",
      ],
      {
        input: JSON.stringify({
          questions: [question(6), question(13)],
          lesson: cpeLessons.a663,
        }),
        encoding: "utf8",
        timeout: 180_000,
      },
    );
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  },
);
