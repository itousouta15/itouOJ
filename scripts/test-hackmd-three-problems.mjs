import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync,readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { hackmdProblems,sourceNotice } from "../prisma/seed-data/hackmd-three-problems.mjs";
import { prepareHackmdProblems,importHackmdProblems,validateHackmdInput } from "./lib/import-hackmd-three.mjs";
import { solveCampfire,solveSuperstring,solveCollatz,reachableCollatz } from "./lib/hackmd-three-solvers.mjs";

const prepared=prepareHackmdProblems();
function database(t) {
  const db=new Database(":memory:"); t.after(()=>db.close()); db.pragma("foreign_keys = ON");
  const root=new URL("../prisma/migrations/",import.meta.url);
  for(const folder of readdirSync(root,{withFileTypes:true}).filter(f=>f.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name)))
    db.exec(readFileSync(new URL(`${folder.name}/migration.sql`,root),"utf8"));
  return db;
}
function slowCampfire(teams) {
  const alive=teams.map((_,i)=>i); let current=0;
  while(new Set(alive.map(i=>teams[i])).size>1) {
    let victim=(alive.indexOf(current)+1)%alive.length;
    while(teams[alive[victim]]===teams[current]) victim=(victim+1)%alive.length;
    alive.splice(victim,1);
    current=alive[(alive.indexOf(current)+1)%alive.length];
  }
  return `${teams.length-alive.length} ${teams[current]}`;
}
test("three source samples, containment/ties, sentinel cycles and 64-bit totals",()=>{
  assert.equal(hackmdProblems.length,3);
  for(const p of hackmdProblems) assert.ok(prepared.find(s=>s.key===p.key).statement.includes(sourceNotice));
  assert.equal(solveCampfire("6 3\n2 2 3 1 1 2"),"4 2");
  assert.equal(solveCampfire("3 3\n1 2 3"),"2 3");
  assert.equal(solveSuperstring("2 2\nab\nba"),"aba");
  assert.equal(solveSuperstring("3 1\na\naa\naaa"),"aaa");
  assert.deepEqual(reachableCollatz(11,3),[7,11,14,22,44,88]);
  assert.equal(solveCollatz("11 3 3\n16 56 330"),"256");
  assert.equal(solveCollatz(`1 0 200000\n${Array(200000).fill("1000000000000").join(" ")}`),"199999999999800000");
});
test("generated tests respect every input bound and reject malformed counts",()=>{
  for(const p of prepared) for(const c of p.cases) validateHackmdInput(p.key,c.input);
  assert.throws(()=>validateHackmdInput("campfire","2 1\n1 2"));
  assert.throws(()=>validateHackmdInput("superstring","2 1\na\na"));
  assert.throws(()=>validateHackmdInput("collatz","1 0 1\n1000000000001"));
  assert.throws(()=>validateHackmdInput("collatz","1 0 2\n1"));
});
test("campfire matches literal removal simulation on exhaustive small circles",()=>{
  for(let n=1;n<=8;n++) for(let bits=0;bits<2**n;bits++) {
    const a=Array.from({length:n},(_,i)=>(bits>>i&1)+1);
    assert.equal(solveCampfire(`${n} 2\n${a.join(" ")}`),slowCampfire(a));
  }
  for(let mask=0;mask<3**6;mask++) {
    let value=mask;const a=Array.from({length:6},()=>{const t=value%3+1;value=Math.floor(value/3);return t;});
    assert.equal(solveCampfire(`6 3\n${a.join(" ")}`),slowCampfire(a));
  }
});
test("superstring DP matches lexicographic exhaustive text search",()=>{
  const words=["a","b","aa","ab","ba","bb","aab","aba","bab","bba"];
  for(let i=0;i<words.length;i++) for(let j=i+1;j<words.length;j++) for(let k=j+1;k<words.length;k++) {
    const group=[words[i],words[j],words[k]]; let level=[""],answer;
    while(answer===undefined) {
      answer=level.find(s=>group.every(w=>s.includes(w)));
      if(answer===undefined) level=level.flatMap(s=>[s+"a",s+"b"]);
    }
    assert.equal(solveSuperstring(`3 2\n${group.join("\n")}`),answer);
  }
});
test("Collatz reverse generation matches bounded forward enumeration",()=>{
  for(let n=1;n<=20;n++) for(let k=0;k<=6;k++) {
    const expected=[];
    for(let start=1;start<=n*2**k;start++) {
      let value=start;
      for(let step=0;step<=k;step++) {
        if(value===n) { expected.push(start);break; }
        value=value%2 ? 3*value+1 : value/2;
      }
    }
    assert.deepEqual(reachableCollatz(n,k),expected);
    const queries=[1,2,n,100,1000000000000];
    const total=queries.reduce((sum,a)=>sum+BigInt(Math.min(...expected.map(x=>Math.abs(a-x)))),0n);
    assert.equal(solveCollatz(`${n} ${k} ${queries.length}\n${queries.join(" ")}`),String(total));
  }
});
test("atomic import allocates codes, hides custom tests, and preserves existing edits on rerun",t=>{
  const db=database(t);
  db.prepare(`INSERT INTO Problem (title,statement,problemCode,"order") VALUES ('TOI 營火晚會','unrelated','a876',876)`).run();
  const first=importHackmdProblems(db,prepared);
  assert.deepEqual(first.created.map(p=>p.code),["a877","a878","a879"]);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=1").get().n,4);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase WHERE isSample=0").get().n,prepared.reduce((sum,p)=>sum+p.cases.length-p.samples.length,0));
  const id=first.created[0].id;
  db.prepare("UPDATE Problem SET statement='管理員修改',isPublic=0 WHERE id=?").run(id);
  db.prepare("UPDATE TestCase SET output='custom answer' WHERE problemId=? AND isSample=0").run(id);
  const rows=db.prepare("SELECT * FROM Problem ORDER BY id").all(),cases=db.prepare("SELECT * FROM TestCase ORDER BY id").all();
  const second=importHackmdProblems(db,prepared);
  assert.equal(second.created.length,0);assert.equal(second.skipped.length,3);
  assert.deepEqual(db.prepare("SELECT * FROM Problem ORDER BY id").all(),rows);
  assert.deepEqual(db.prepare("SELECT * FROM TestCase ORDER BY id").all(),cases);
});
test("an insertion failure rolls back all three problems and tests",t=>{
  const db=database(t);
  db.exec(`CREATE TRIGGER fail_last BEFORE INSERT ON Problem WHEN NEW.title LIKE '%考拉茲%' BEGIN SELECT RAISE(ABORT,'fixture failure'); END;`);
  assert.throws(()=>importHackmdProblems(db,prepared),/fixture failure/);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Problem").get().n,0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM TestCase").get().n,0);
});
test("CLI check never opens DATABASE_URL and writes require an explicit path",()=>{
  const script=fileURLToPath(new URL("./import-hackmd-three-problems.mjs",import.meta.url));
  const check=spawnSync(process.execPath,[script,"--check"],{encoding:"utf8",env:{...process.env,DATABASE_URL:"file:/nonexistent/production.db"},timeout:120000});
  assert.equal(check.status,0,check.stderr);assert.match(check.stdout,/未開啟或修改資料庫/);
  const invalid=spawnSync(process.execPath,[script],{encoding:"utf8",timeout:120000});
  assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/明確的SQLite路徑/);
});
test("independent Linux C++ references match every sample and generated test",{
  skip:process.platform==="win32" ? "Run via WSL/Linux only; never generate Windows executables." : false,
},()=>{
  const result=spawnSync("python3",[fileURLToPath(new URL("./lib/check-hackmd-three.py",import.meta.url))],{
    input:JSON.stringify(prepared),encoding:"utf8",timeout:180000,
  });
  assert.equal(result.status,0,result.stdout+result.stderr);process.stdout.write(result.stdout);
});
