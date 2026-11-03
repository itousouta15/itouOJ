import assert from "node:assert/strict";
import { hackmdProblems, statementFor } from "../../prisma/seed-data/hackmd-three-problems.mjs";
import { hiddenInputs, solvers } from "./hackmd-three-solvers.mjs";
import { nextProblemCode } from "./problemCode.mjs";

export function validateHackmdInput(key,input) {
  const t=input.trim().split(/\s+/), numbers=t.map(Number);
  const integer=(n,lo,hi)=>Number.isInteger(n) && n>=lo && n<=hi;
  if(key==="campfire") {
    const [n,k]=numbers;
    assert.ok(integer(n,1,200000) && integer(k,1,200000) && numbers.length===n+2);
    assert.ok(numbers.slice(2).every(v=>integer(v,1,k)));
  } else if(key==="superstring") {
    const [n,k]=numbers,words=t.slice(2);
    assert.ok(integer(n,1,8) && integer(k,1,26) && words.length===n && new Set(words).size===n);
    assert.ok(words.every(w=>/^[a-z]{1,10}$/.test(w) && [...w].every(ch=>ch.charCodeAt(0)<97+k)));
  } else if(key==="collatz") {
    const [n,k,q]=numbers;
    assert.ok(integer(n,1,1000000) && integer(k,0,20) && integer(q,1,200000) && numbers.length===q+3);
    assert.ok(numbers.slice(3).every(v=>integer(v,1,1000000000000)));
  } else throw new Error(`Unknown problem ${key}`);
}

export function prepareHackmdProblems() {
  return hackmdProblems.map(p=>{
    for(const sample of p.samples) { validateHackmdInput(p.key,sample.input); assert.equal(solvers[p.key](sample.input),sample.output,`${p.title}: source sample mismatch`); }
    const samples=new Set(p.samples.map(s=>s.input));
    const hidden=hiddenInputs(p.key).filter(input=>!samples.has(input)).map(input=>{validateHackmdInput(p.key,input);return {input,output:solvers[p.key](input),isSample:false};});
    assert.ok(hidden.length>=3);
    return {...p,statement:statementFor(p),cases:[...p.samples.map(s=>({...s,isSample:true})),...hidden]};
  });
}

export function importHackmdProblems(db,problems=prepareHackmdProblems()) {
  // The caller supplies a database explicitly. Never inspect DATABASE_URL here.
  const find=db.prepare("SELECT id,problemCode FROM Problem WHERE type='PROGRAMMING' AND title=?");
  const insert=db.prepare(`INSERT INTO Problem (title,statement,type,difficulty,timeLimitMs,memoryLimitMb,isPublic,problemCode,"order")
    VALUES (?,?,'PROGRAMMING',?,?,256,1,?,?)`);
  const test=db.prepare('INSERT INTO TestCase (problemId,input,output,isSample,"order") VALUES (?,?,?,?,?)');
  return db.transaction(()=>{
    let code=nextProblemCode(db.prepare("SELECT MAX(problemCode) AS code FROM Problem WHERE type='PROGRAMMING'").get().code);
    let order=db.prepare('SELECT COALESCE(MAX("order"),0) AS n FROM Problem WHERE type=\'PROGRAMMING\'').get().n;
    const created=[],skipped=[];
    for(const p of problems) {
      const existing=find.get(p.title);
      if(existing) {skipped.push({...existing,title:p.title});continue;}
      const id=Number(insert.run(p.title,p.statement,p.difficulty,p.timeLimitMs,code,++order).lastInsertRowid);
      for(const [i,c] of p.cases.entries()) test.run(id,c.input,c.output,Number(c.isSample),i+1);
      created.push({id,code,title:p.title,publicSamples:p.samples.length,hiddenCases:p.cases.length-p.samples.length});
      code=nextProblemCode(code);
    }
    return {created,skipped};
  }).immediate();
}
