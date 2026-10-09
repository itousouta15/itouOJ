"use client";
import {useEffect,useRef,useState} from 'react';
import type {ProblemTutorial} from '@/lib/problemTutorial';
export default function ProblemTutorialButton({lesson}:{lesson:ProblemTutorial}){
 const dialog=useRef<HTMLDialogElement>(null);
 const trigger=useRef<HTMLButtonElement>(null);
 const [step,setStep]=useState(0);
 const [playing,setPlaying]=useState(false);
 const [reduced,setReduced]=useState(false);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(media.matches); update(); media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);
 useEffect(()=>{
  if(!playing)return;
  const timer=setInterval(()=>setStep(current=>{
   if(current>=lesson.frames.length-1){setPlaying(false);return current;}
   return current+1;
  }),4500);
  return()=>clearInterval(timer);
 },[playing,lesson.frames.length]);
 const frame=lesson.frames[step];
 function close(){setPlaying(false);dialog.current?.close(); trigger.current?.focus();}
 return <>
  <button ref={trigger} type="button" className="btn-secondary px-3 py-1 text-sm" onClick={()=>{setStep(0);setPlaying(false);dialog.current?.showModal();}}>教學</button>
  <dialog ref={dialog} className="w-[min(94vw,680px)] max-h-[90dvh] overflow-y-auto rounded-xl border border-bd bg-panel p-0 text-tx backdrop:bg-black/65" aria-label={`${lesson.title}・引導教學`} onCancel={()=>setPlaying(false)} onClose={()=>{setPlaying(false);trigger.current?.focus();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
   <header className="flex items-start justify-between gap-3 border-b border-bd p-5"><div><h2 className="section-title">{lesson.title}・教學</h2><p className="mt-2 text-sm text-dim">理解題意，不提供解答、程式碼或計算結果。</p></div><button type="button" className="btn-secondary" autoFocus onClick={close} aria-label="關閉教學">✕</button></header>
   <div className="space-y-5 p-5">
    <p className="mono text-sm text-mute">步驟 {step+1} / {lesson.frames.length}</p>
    <div aria-live="polite" aria-atomic="true"><h3 className="font-semibold">{frame.caption}</h3><div key={step} className="my-6 flex flex-wrap items-center justify-center gap-3 rounded-lg bg-inset p-5" aria-label="題意動畫">
     {frame.cards.map((card,i)=><div key={card} className="tutorial-card rounded-lg border border-bd bg-panel px-4 py-5 text-center" style={{animationDelay:`${i*160}ms`}}>{card}</div>)}
    </div><p className="rounded-lg border border-bd p-4 text-sm">想一想：{frame.prompt}</p></div>
    <div className="flex flex-wrap justify-center gap-2"><button type="button" className="btn-secondary" disabled={step===0} onClick={()=>{setPlaying(false);setStep(step-1);}}>上一步</button><button type="button" className="btn-primary" disabled={step===lesson.frames.length-1&&!playing} onClick={()=>setPlaying(!playing)}>{playing?'暫停':'播放'}</button><button type="button" className="btn-secondary" disabled={step===lesson.frames.length-1} onClick={()=>{setPlaying(false);setStep(step+1);}}>下一步</button><button type="button" className="btn-secondary" onClick={()=>{setPlaying(false);setStep(0);}}>重新播放</button></div>
    {reduced&&<p className="text-xs text-mute">已遵循減少動態效果設定；仍可手動逐步閱讀。</p>}
   </div>
   <style>{`@keyframes tutorial-arrive{from{opacity:0;transform:translateY(18px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}.tutorial-card{animation:tutorial-arrive .6s both}@media(prefers-reduced-motion:reduce){.tutorial-card{animation:none}}`}</style>
  </dialog>
 </>;
}
