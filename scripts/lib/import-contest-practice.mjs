import assert from "node:assert/strict";
import { practiceProblems, practiceStatement } from "../../prisma/seed-data/contest-practice-problems.mjs";
import { hiddenInputs, solvers } from "./contest-practice-solvers.mjs";
import { nextProblemCode } from "./problemCode.mjs";

const valid = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi;

export function validatePracticeInput(key, input) {
  const a = input.trim().split(/\s+/).map(Number);
  let n, m, at;
  switch (key) {
    case "rectangle": {
      [n, m] = a;
      assert.ok(valid(n, 1, 400) && valid(m, 1, 400));
      at = 2 + n * m;
      assert.ok(a.slice(2, at).every((x) => valid(x, -1000000, 1000000)));
      const q = a[at++];
      assert.ok(valid(q, 1, 10000) && a.length === at + 4 * q);
      for (let i = 0; i < q; i++) {
        const [r1, c1, r2, c2] = a.slice(at + 4 * i, at + 4 * i + 4);
        assert.ok(valid(r1, 1, n) && valid(r2, r1, n) && valid(c1, 1, m) && valid(c2, c1, m));
      }
      break;
    }
    case "capacity":
      [n, m] = a;
      assert.ok(valid(n, 1, 200000) && valid(m, 1, n) && a.length === n + 2);
      assert.ok(a.slice(2).every((x) => valid(x, 1, 1000000000)));
      break;
    case "prerequisites":
      [n, m] = a;
      assert.ok(valid(n, 1, 100000) && valid(m, 0, 100000) && a.length === 2 + 2 * m);
      assert.ok(a.slice(2).every((x) => valid(x, 1, n)));
      break;
    case "route":
      [n, m] = a;
      assert.ok(valid(n, 1, 50000) && valid(m, 0, 100000) && a.length === 4 + 3 * m);
      assert.ok(valid(a[2], 1, n) && valid(a[3], 1, n));
      for (let i = 0; i < m; i++) {
        assert.ok(valid(a[4 + 3 * i], 1, n) && valid(a[5 + 3 * i], 1, n) && valid(a[6 + 3 * i], 1, 1000000));
      }
      break;
    case "ascent":
      n = a[0];
      assert.ok(valid(n, 1, 200000) && a.length === n + 1);
      assert.ok(a.slice(1).every((x) => valid(x, -1000000000, 1000000000)));
      break;
    case "equipment":
      [n, m] = a;
      assert.ok(valid(n, 1, 200) && valid(m, 0, 10000) && a.length === 2 + 2 * n);
      for (let i = 0; i < n; i++) assert.ok(valid(a[2 + 2 * i], 1, 10000) && valid(a[3 + 2 * i], 0, 1000000));
      break;
    default: throw new Error(`Unknown practice problem: ${key}`);
  }
}

export function preparePracticeProblems() {
  return practiceProblems.map((problem) => {
    const seen = new Set(), cases = [];
    for (const [isSample, inputs] of [[true, problem.samples], [false, hiddenInputs(problem.key)]]) {
      for (const item of inputs) {
        const input = isSample ? item.input : item;
        assert.ok(!seen.has(input), `${problem.title}: duplicate input`);
        seen.add(input);
        assert.ok(Buffer.byteLength(input) <= 2 * 1024 * 1024, `${problem.title}: input too large`);
        validatePracticeInput(problem.key, input);
        const output = solvers[problem.key](input);
        if (isSample) assert.equal(output, item.output, `${problem.title}: wrong sample output`);
        assert.ok(output.length > 0 && Buffer.byteLength(output) <= 2 * 1024 * 1024);
        cases.push({ input, output, isSample });
      }
    }
    assert.ok(problem.samples.length >= 2 && cases.length - problem.samples.length >= 4);
    return { ...problem, statement: practiceStatement(problem), cases };
  });
}

export function importPracticeProblems(db, problems = preparePracticeProblems()) {
  const find = db.prepare("SELECT id FROM Problem WHERE type='PROGRAMMING' AND title=?");
  const insert = db.prepare(`INSERT INTO Problem (title, statement, type, difficulty, timeLimitMs, memoryLimitMb, isPublic, problemCode, "order")
    VALUES (?, ?, 'PROGRAMMING', ?, ?, 256, 1, ?, ?)`);
  const testCase = db.prepare('INSERT INTO TestCase (problemId, input, output, isSample, "order") VALUES (?, ?, ?, ?, ?)');
  const getTag = db.prepare("SELECT id FROM Tag WHERE name=?");
  const createTag = db.prepare("INSERT INTO Tag (name) VALUES (?)");
  const addTag = db.prepare("INSERT INTO ProblemTag (problemId, tagId) VALUES (?, ?)");
  return db.transaction(() => {
    let code = nextProblemCode(db.prepare("SELECT MAX(problemCode) AS code FROM Problem WHERE type='PROGRAMMING'").get().code);
    let order = db.prepare('SELECT COALESCE(MAX("order"),0) AS n FROM Problem WHERE type=\'PROGRAMMING\'').get().n;
    const created = [], skipped = [];
    let tagId = getTag.get("競賽練習")?.id;
    for (const problem of problems) {
      const old = find.get(problem.title);
      if (old) { skipped.push(problem.title); continue; }
      if (!tagId) tagId = Number(createTag.run("競賽練習").lastInsertRowid);
      const id = Number(insert.run(problem.title, problem.statement, problem.difficulty, problem.timeLimitMs, code, ++order).lastInsertRowid);
      problem.cases.forEach((c, i) => testCase.run(id, c.input, c.output, Number(c.isSample), i + 1));
      addTag.run(id, tagId);
      created.push({ code, id, title: problem.title, samples: problem.samples.length, hidden: problem.cases.length - problem.samples.length });
      code = nextProblemCode(code);
    }
    return { created, skipped };
  }).immediate();
}
