import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildLearningPath } from "@/lib/learningPath";
import DifficultyBadge from "@/components/DifficultyBadge";
export const dynamic = "force-dynamic";
export const metadata:Metadata={title:"學習路徑",description:"從條件判斷到動態規劃，依觀念順序練習 itouOJ 公開題目並追蹤解題進度。",alternates:{canonical:"/learning-path"}};
export default async function LearningPathPage(){
 const session=await getSession();
 const problems=await prisma.problem.findMany({where:{isPublic:true,type:"PROGRAMMING",problemCode:{not:null}},select:{id:true,title:true,problemCode:true,type:true,isPublic:true,difficulty:true,tags:{select:{tag:{select:{name:true}}}}}});
 const solved=session?await prisma.submission.findMany({where:{userId:session.userId,status:"AC",problemId:{in:problems.map(p=>p.id)}},distinct:["problemId"],select:{problemId:true}}):[];
 const path=buildLearningPath(problems,new Set(solved.map(p=>p.problemId)));
 return <div className="space-y-6">
  <header><h1 className="page-title">你的學習路徑</h1><p className="mt-2 text-sm text-dim">依觀念的基礎到進階順序練習；不鎖章節，隨時可以回頭複習。</p></header>
  <section className="card p-5" aria-label="整體解題進度">
   <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="section-title">一步一步累積實力</h2><span className="mono">{path.solved} / {path.total} 題 AC</span></div>
   <progress className="mt-3 h-3 w-full accent-[var(--green)]" value={path.solved} max={path.total||1} aria-label="整體解題進度"/>
   {!session?<p className="mt-3 text-sm text-dim"><Link href="/login?next=%2Flearning-path" className="text-blue hover:underline">登入</Link>後以本人 AC 紀錄追蹤進度，網站與 App 共用。</p>:path.next?<Link href={`/problems/${path.next.problemCode}`} className="btn-primary mt-3 inline-flex">繼續練習：{path.next.title} →</Link>:<p className="mt-3 text-sm text-dim">{path.total?"目前公開題目全部完成了，可以挑一章複習！":"目前沒有公開實作題目。"}</p>}
  </section>
  <nav aria-label="章節捷徑" className="flex flex-wrap gap-2">{path.chapters.map((c,i)=><a key={c.id} href={`#chapter-${c.id}`} className="btn-secondary text-sm">{i+1}. {c.title}</a>)}</nav>
  <div className="space-y-3">{path.chapters.map((c,i)=><details key={c.id} id={`chapter-${c.id}`} className="card scroll-mt-24" open={c.problems.some(p=>p.id===path.next?.id)}>
   <summary className="cursor-pointer p-5"><span className="mono mr-3 text-mute">{String(i+1).padStart(2,'0')}</span><span className="font-semibold">{c.title}</span><span className="mono ml-3 text-sm text-dim">{c.solved} / {c.problems.length}</span><p className="mt-2 text-sm text-dim">{c.description}</p></summary>
   <div className="border-t border-[var(--border)] px-5 pb-5 pt-3"><progress className="mb-3 h-2 w-full accent-[var(--green)]" value={c.solved} max={c.problems.length||1} aria-label={`${c.title}進度`}/>
   {c.problems.length?<ul className="divide-y divide-[var(--border)]">{c.problems.map(p=><li key={p.id}><Link href={`/problems/${p.problemCode}`} className="flex flex-wrap items-center gap-3 rounded p-3 hover:bg-panel2"><span aria-label={p.solved?"已 AC":"尚未 AC"} className={p.solved?"text-green":"text-mute"}>{p.solved?"✓":"○"}</span><span className="min-w-0 flex-1 break-words">{p.title}</span><DifficultyBadge difficulty={p.difficulty}/><span className="mono text-xs text-mute">{p.problemCode}</span><span className="text-sm text-blue">練習 →</span></Link></li>)}</ul>:<p className="text-sm text-mute">此章目前沒有對應標籤的公開題目。</p>}
   </div>
  </details>)}</div>
  <p className="text-xs text-mute">依站內題目標籤分類，多觀念題歸入較進階章節；未對應標籤的題目列於「其他練習」。進度只計 AC，不把開啟題目當作完成。此頁提供學習編排，不宣稱包含 APCS 全部歷屆試題或動畫題解。</p>
 </div>;
}
