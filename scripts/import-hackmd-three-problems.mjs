// --check performs no database access; writes always require an explicit --db.
import Database from "better-sqlite3";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { prepareHackmdProblems, importHackmdProblems } from "./lib/import-hackmd-three.mjs";

const args=process.argv.slice(2), check=args.length===1 && args[0]==="--check";
const write=args.length===2 && args[0]==="--db" && args[1] && !args[1].startsWith("--");
if(!check && !write) throw new Error("用法：node scripts/import-hackmd-three-problems.mjs --check | --db 明確的SQLite路徑");
const problems=prepareHackmdProblems();
if(check) {
  for(const p of problems) console.log(`${p.title}：${p.samples.length} 組來源範例、${p.cases.length-p.samples.length} 組自製隱藏測資`);
  console.log("核對完成：3 題；未開啟或修改資料庫。");
} else {
  const db=new Database(resolve(args[1]),{fileMustExist:true});
  try {
    db.pragma("foreign_keys = ON");
    const backup=join(tmpdir(),`itouoj-before-hackmd-three-${randomUUID()}.db`);
    await db.backup(backup);
    console.log(`匯入前備份：${backup}`);
    const result=importHackmdProblems(db,problems);
    for(const p of result.created) console.log(`新增 ${p.code} #${p.id} ${p.title}（範例 ${p.publicSamples}、隱藏 ${p.hiddenCases}）`);
    console.log(`完成：新增 ${result.created.length} 題、保留既有題目 ${result.skipped.length} 題。`);
  } finally { db.close(); }
}
