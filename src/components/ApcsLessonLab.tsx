"use client";

import { useEffect, useRef, useState } from "react";
import type { ApcsLesson } from "@/lib/apcsCourseLessons";

export default function ApcsLessonLab({ lesson }: { lesson: ApcsLesson }) {
  const [stepIndex, setStepIndex] = useState(0);
  const stepIndexRef = useRef(0);
  const [language, setLanguage] = useState<"cpp" | "python">("cpp");
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const step = lesson.trace[stepIndex];
  const code = language === "cpp" ? lesson.cpp : lesson.python;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const next = stepIndexRef.current + 1;
      if (next >= lesson.trace.length) {
        setPlaying(false);
        return;
      }
      stepIndexRef.current = next;
      setStepIndex(next);
      if (next === lesson.trace.length - 1) setPlaying(false);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [playing, lesson.trace.length]);

  function selectStep(index: number) {
    stepIndexRef.current = index;
    setStepIndex(index);
  }

  function togglePlayback() {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (stepIndexRef.current >= lesson.trace.length - 1) selectStep(0);
    setPlaying(true);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden" aria-labelledby="trace-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bd p-4 sm:p-5">
          <div>
            <p className="mono text-xs uppercase tracking-[0.16em] text-mute">Step-by-step animation</p>
            <h2 id="trace-title" className="mt-1 text-lg font-semibold">{lesson.traceLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={togglePlayback}>
              {playing ? "暫停" : "▶ 播放"}
            </button>
            <button type="button" className="btn-secondary px-3 py-2 text-sm" onClick={() => { setPlaying(false); selectStep(0); }}>
              重播
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <span className="vbadge vbadge-blue">步驟 {stepIndex + 1} / {lesson.trace.length}</span>
            <div className="flex gap-1" aria-label="動畫進度">
              {lesson.trace.map((item, index) => (
                <span key={item.title} className={`h-1.5 w-7 rounded-full ${index <= stepIndex ? "bg-[var(--blue)]" : "bg-inset"}`} />
              ))}
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
          <p className="mt-1 min-h-12 max-w-3xl text-sm leading-6 text-dim">{step.description}</p>

          <div className="mt-5 flex min-h-24 flex-wrap items-center justify-center gap-2 rounded-xl bg-inset p-4" role="list" aria-label={lesson.traceLabel}>
            {step.cells.map((cell, index) => (
              <div
                key={`${stepIndex}-${index}-${cell}`}
                role="listitem"
                className={`min-w-12 rounded-lg border px-3 py-2 text-center font-mono text-sm transition-all duration-300 ${step.active?.includes(index) ? "-translate-y-1 border-blue bg-blue/10 text-blue shadow-md" : "border-bd bg-panel text-tx"}`}
              >
                {cell}
              </div>
            ))}
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {step.variables.map(([name, value]) => (
              <div key={name} className="rounded-lg border border-bd p-3">
                <dt className="mono text-xs text-mute">{name}</dt>
                <dd className="mt-1 break-words font-mono text-sm font-semibold text-tx">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={stepIndex === 0} onClick={() => { setPlaying(false); selectStep(Math.max(0, stepIndex - 1)); }}>← 上一步</button>
            <div className="flex gap-1">
              {lesson.trace.map((item, index) => (
                <button key={item.title} type="button" aria-label={`跳到步驟 ${index + 1}`} aria-current={index === stepIndex ? "step" : undefined} className={`size-2.5 rounded-full ${index === stepIndex ? "bg-[var(--blue)]" : "bg-bd"}`} onClick={() => { setPlaying(false); selectStep(index); }} />
              ))}
            </div>
            <button type="button" className="btn-primary px-3 py-2 text-sm" disabled={stepIndex === lesson.trace.length - 1} onClick={() => { setPlaying(false); selectStep(Math.min(lesson.trace.length - 1, stepIndex + 1)); }}>下一步 →</button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="code-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bd p-4 sm:p-5">
          <div>
            <p className="mono text-xs uppercase tracking-[0.16em] text-mute">Reference solution</p>
            <h2 id="code-title" className="mt-1 text-lg font-semibold">完整程式</h2>
          </div>
          <div className="flex gap-1 rounded-lg bg-inset p-1" role="tablist" aria-label="選擇程式語言">
            <button type="button" role="tab" aria-selected={language === "cpp"} className={`rounded-md px-3 py-1.5 text-sm ${language === "cpp" ? "bg-panel text-tx shadow-sm" : "text-dim"}`} onClick={() => setLanguage("cpp")}>C++</button>
            <button type="button" role="tab" aria-selected={language === "python"} className={`rounded-md px-3 py-1.5 text-sm ${language === "python" ? "bg-panel text-tx shadow-sm" : "text-dim"}`} onClick={() => setLanguage("python")}>Python</button>
          </div>
        </div>
        <div className="relative">
          <button type="button" onClick={copyCode} className="btn-secondary absolute right-3 top-3 z-10 px-2.5 py-1 text-xs">{copied ? "已複製" : "複製程式"}</button>
          <pre className="max-h-[36rem] overflow-auto p-4 pt-14 text-sm leading-6 sm:p-5 sm:pt-14"><code className="font-mono">{code}</code></pre>
        </div>
        <p className="border-t border-bd px-4 py-3 text-xs text-mute sm:px-5">先試著自己完成，再切換語言比對解法。參考程式可複製到題目編輯器。</p>
      </section>
    </div>
  );
}
