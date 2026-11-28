import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Database from "better-sqlite3";
import { cpeLessons } from "../src/lib/cpeLessons.ts";
import { toiPotentialLessons } from "../src/lib/toiPotentialLessons.ts";
import "./test-recognition-nov08-corrections.mjs";

const name = "20261031000000_correct_recognition_audit";
const root = new URL("../prisma/migrations/", import.meta.url);
const migration = await readFile(new URL(`${name}/migration.sql`, root), "utf8");
const legacy = JSON.parse(await readFile(new URL("./fixtures/recognition-audit-legacy.json", import.meta.url), "utf8"));
const earlier = await Promise.all((await readdir(root, { withFileTypes: true }))
  .filter(e => e.isDirectory() && e.name < name).sort((a,b) => a.name.localeCompare(b.name))
  .map(e => readFile(new URL(`${e.name}/migration.sql`, root), "utf8")));
const corrected = await Promise.all(legacy.map(async old => {
  const seed = JSON.parse(await readFile(new URL(`../prisma/seed-data/recognition/${old.file}.json`, import.meta.url), "utf8"));
  return seed.questions.find(q => q.number === old.question.number);
}));
function values(q) {
  return { statement:q.question.trim(), code:q.code, options:JSON.stringify(q.options.map(o=>o.trim())), answerIndex:q.answerIndex, explanation:q.explanation?.trim() || null };
}
function database(t) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.pragma("foreign_keys = ON");
  for (const sql of earlier) db.exec(sql);
  return db;
}
function insert(db, i, overrides={}) {
  const old=legacy[i];
  const row={...values(old.question),title:`${old.source}${old.paper ? ` ${old.paper}` : ""} 第 ${old.question.number} 題`,paper:old.paper,sourceNumber:old.question.number,category:old.question.category,type:"RECOGNITION",order:db.prepare("SELECT COUNT(*) AS n FROM Problem").get().n+100,...overrides};
  return Number(db.prepare(`INSERT INTO Problem (title,type,statement,code,options,answerIndex,explanation,paper,sourceNumber,category,"order")
    VALUES (@title,@type,@statement,@code,@options,@answerIndex,@explanation,@paper,@sourceNumber,@category,@order)`).run(row).lastInsertRowid);
}
test("eight exact legacy rows migrate while IDs, answer keys and progress remain unchanged", t => {
  const db=database(t);
  db.prepare("INSERT INTO User (id,username,passwordHash) VALUES ('learner','learner','unused')").run();
  for(let i=0;i<legacy.length;i++) {
    const id=insert(db,i);
    db.prepare(`INSERT INTO RecognitionAnswer (userId,problemId,selectedIndex,isCorrect,updatedAt) VALUES ('learner',?,?,1,CURRENT_TIMESTAMP)`).run(id,legacy[i].question.answerIndex);
  }
  const before=db.prepare("SELECT * FROM Problem ORDER BY id").all();
  const progress=db.prepare("SELECT * FROM RecognitionAnswer ORDER BY id").all();
  db.exec(migration);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before.map((r,i)=>({...r,...values(corrected[i])})));
  assert.deepEqual(db.prepare("SELECT * FROM RecognitionAnswer ORDER BY id").all(),progress);
  assert.deepEqual(corrected.map(q=>q.answerIndex),legacy.map(x=>x.question.answerIndex));
  const count=db.prepare("SELECT total_changes() AS n").get().n;
  db.exec(migration);
  assert.equal(db.prepare("SELECT total_changes() AS n").get().n,count);
});
test("custom rows and changed identity/content are never overwritten", t => {
  const db=database(t);
  for(let i=0;i<legacy.length;i++) {
    const q=legacy[i].question;
    for(const override of [{type:"PROGRAMMING"},{title:"Custom"},{paper:"Other"},{sourceNumber:999},{category:"Python"},
      {statement:q.question+" custom"},{code:q.code+"\n// custom"},{options:'["custom","options"]'},
      {answerIndex:(q.answerIndex+1)%q.options.length},{explanation:"自訂解析"}]) insert(db,i,override);
  }
  const before=db.prepare("SELECT * FROM Problem ORDER BY id").all();
  db.exec(migration);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before);
});
test("migration is safe on empty databases, corrected imports and CRLF SQL checkouts", t => {
  const db=database(t);
  db.exec(migration);
  for(let i=0;i<legacy.length;i++) insert(db,i,values(corrected[i]));
  const before=db.prepare("SELECT * FROM Problem ORDER BY id").all();
  db.exec(migration);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),before);
  for(let i=0;i<legacy.length;i++) insert(db,i);
  db.exec(migration.replace(/\r?\n/g,"\r\n"));
  assert.deepEqual(db.prepare("SELECT statement,code,options,answerIndex,explanation FROM Problem ORDER BY id").all(),[...corrected,...corrected].map(values));
});
test("magic-square reconstruction and remaining specification conflict are explicit", () => {
  const magic=corrected.find((q,i)=>legacy[i].file==="apcs-2021-01-a" && q.number===14);
  assert.match(magic.question,/本站修正版練習，非原卷逐字轉錄/);
  assert.match(magic.explanation,/反對角線會得到 24/);
  for(const q of corrected) assert.doesNotMatch(q.code,/[\u2006“”]/);
  assert.match(cpeLessons.a646.complexity,/總空間 O\(L\)/);
  assert.match(toiPotentialLessons.a344.explanation.join("\n"),/來源未澄清前，不能宣稱/);
});
function verify(mode) {
  const result=spawnSync(process.env.PYTHON || "python3",[fileURLToPath(new URL("./lib/check-recognition-audit-corrections.py",import.meta.url)),mode],{
    input:JSON.stringify({questions:corrected.map((q,i)=>({file:legacy[i].file,...q})),lesson:cpeLessons.a646}),encoding:"utf8",timeout:180_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status,0,result.stdout+result.stderr);
  process.stdout.write(result.stdout);
}
test("a646 streams its input, preserves formatting and matches an independent oracle",()=>verify("--python-only"));
test("recognition snippets and a646 execute as Linux C/C++ with independent checks",{
  skip:process.platform==="win32" ? "Linux runtime checks execute in CI/WSL; never run generated Windows binaries." : false,
},()=>verify("--cxx-only"));
