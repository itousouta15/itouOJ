import assert from "node:assert/strict";
import { readFile, readdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Database from "better-sqlite3";
import { applyRecognitionLegacyCorrections } from "./lib/recognition-legacy-corrections.mjs";
import { cpeLessons } from "../src/lib/cpeLessons.ts";
import { cpeProblemCatalog } from "../src/lib/cpeProblemCatalog.ts";

const name = "20261108000000_correct_recognition_legacy";
const root = new URL("../prisma/migrations/", import.meta.url);
const sql = await readFile(new URL(`${name}/migration.sql`, root), "utf8");
const legacy = JSON.parse(await readFile(new URL("./fixtures/recognition-nov08-legacy.json", import.meta.url), "utf8"));
const seeds = await Promise.all(legacy.map(async old => JSON.parse(await readFile(
  new URL(`../prisma/seed-data/recognition/${old.file}.json`, import.meta.url), "utf8",
)).questions.find(q => q.number === old.question.number)));
const earlier = await Promise.all((await readdir(root, { withFileTypes: true }))
  .filter(e => e.isDirectory() && e.name < name).sort((a,b) => a.name.localeCompare(b.name))
  .map(e => readFile(new URL(`${e.name}/migration.sql`, root), "utf8")));
function values(q, old) {
  return { type: "RECOGNITION", title: `${old.source}${old.paper ? ` ${old.paper}` : ""} 第 ${q.number} 題`,
    paper: old.paper, sourceNumber: q.number, category: q.category, statement: q.question.trim(),
    code: q.code, options: JSON.stringify(q.options.map(s => s.trim())), answerIndex: q.answerIndex,
    explanation: q.explanation?.trim() || null };
}
function database(t, path = ":memory:") {
  const db = new Database(path); t.after(() => db.close()); db.pragma("foreign_keys = ON");
  for (const migration of earlier) db.exec(migration);
  return db;
}
function insert(db, i, overrides = {}) {
  const row = {...values(legacy[i].question, legacy[i]), ...overrides};
  const fields = Object.keys(row);
  return Number(db.prepare(`INSERT INTO Problem (${fields.map(k=>`"${k}"`)},"order")
    VALUES (${fields.map(k=>`@${k}`)},(SELECT COUNT(*)+100 FROM Problem))`).run(row).lastInsertRowid);
}

test("five exact legacy rows upgrade; keys, IDs and learner answers survive; second pass writes nothing", t => {
  const db = database(t);
  db.prepare("INSERT INTO User (id,username,passwordHash) VALUES ('learner','learner','unused')").run();
  legacy.forEach((old,i) => {
    const id = insert(db,i);
    db.prepare("INSERT INTO RecognitionAnswer (userId,problemId,selectedIndex,isCorrect,updatedAt) VALUES ('learner',?,?,1,CURRENT_TIMESTAMP)")
      .run(id,old.question.answerIndex);
  });
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  const progress = db.prepare("SELECT * FROM RecognitionAnswer ORDER BY id").all();
  assert.equal(applyRecognitionLegacyCorrections(db),5);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before.map((r,i)=>({...r,...values(seeds[i],legacy[i])})));
  assert.deepEqual(db.prepare("SELECT * FROM RecognitionAnswer ORDER BY id").all(),progress);
  assert.equal(applyRecognitionLegacyCorrections(db),0);
  assert.deepEqual(seeds.map(q=>q.answerIndex),legacy.map(x=>x.question.answerIndex));
});

test("every identity/content guard protects admin edits; corrected rows and empty databases are no-ops", t => {
  const db = database(t); assert.equal(applyRecognitionLegacyCorrections(db),0);
  legacy.forEach((old,i) => {
    for (const [key,value] of Object.entries(values(old.question,old))) {
      const changed = value === null ? "custom" : typeof value === "number" ? value+1 : value+" custom";
      insert(db,i,{[key]:changed});
    }
    insert(db,i,values(seeds[i],old));
  });
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  assert.equal(applyRecognitionLegacyCorrections(db),0);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before);
  legacy.forEach((_,i)=>insert(db,i));
  db.exec(sql.replace(/\r?\n/g,"\r\n"));
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id DESC LIMIT 5").all().reverse().map(r=>Object.fromEntries(Object.keys(values(seeds[0],legacy[0])).map(k=>[k,r[k]]))),seeds.map((q,i)=>values(q,legacy[i])));
});

test("real importer corrects existing rows and remains idempotent; dry-run leaves disposable DB byte-identical", async t => {
  const folder = await mkdtemp(join(tmpdir(),"recognition-nov08-"));
  const path = join(folder,"test.db");
  const db = database(t,path); legacy.forEach((_,i)=>insert(db,i));
  t.after(()=>rm(folder,{recursive:true,force:true}));
  const run = (...args) => {
    const p = spawnSync(process.execPath,["scripts/import-recognition-questions.mjs","--db",path,...args],{encoding:"utf8",timeout:60000});
    assert.ifError(p.error); assert.equal(p.status,0,p.stdout+p.stderr); return p.stdout;
  };
  const bytes = await readFile(path); run("--dry-run"); assert.deepEqual(await readFile(path),bytes);
  assert.match(run(),/精確舊版更正：5 題/);
  const before = db.prepare("SELECT * FROM Problem ORDER BY id").all();
  assert.match(run(),/精確舊版更正：0 題/);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before);
  seeds.forEach((q,i)=>assert.deepEqual(db.prepare("SELECT statement,code,options,answerIndex,explanation FROM Problem WHERE title=?").get(values(q,legacy[i]).title),
    Object.fromEntries(["statement","code","options","answerIndex","explanation"].map(k=>[k,values(q,legacy[i])[k]]))));
});

const payload = {questions:seeds.map((q,i)=>({auditId:legacy[i].auditId,...q})), legacy,
  lessons:["a678","a680","a685"].map(code=>({...cpeLessons[code],samples:cpeProblemCatalog.find(p=>p.code===code).samples}))};
if (process.env.NOV08_RUNTIME_PAYLOAD) await writeFile(process.env.NOV08_RUNTIME_PAYLOAD,JSON.stringify(payload));
test("Python references pass all samples and independent boundary/oracle checks", () => {
  const p = spawnSync(process.env.PYTHON || "python3",[fileURLToPath(new URL("./lib/check-recognition-nov08.py",import.meta.url)),"--python-only"],
    {input:JSON.stringify(payload),encoding:"utf8",timeout:180000});
  assert.ifError(p.error); assert.equal(p.status,0,p.stdout+p.stderr); process.stdout.write(p.stdout);
});
test("Linux C11/C++ references reproduce defects and pass exact independent oracles", {
  skip: process.platform === "win32" ? "Run C/C++ in WSL/Linux, never as Windows executables." : false,
}, () => {
  const p = spawnSync(process.env.PYTHON || "python3",[fileURLToPath(new URL("./lib/check-recognition-nov08.py",import.meta.url)),"--cxx-only"],
    {input:JSON.stringify(payload),encoding:"utf8",timeout:180000});
  assert.ifError(p.error); assert.equal(p.status,0,p.stdout+p.stderr); process.stdout.write(p.stdout);
});
