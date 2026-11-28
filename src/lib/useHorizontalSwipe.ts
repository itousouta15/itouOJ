"use client";

import { useRef, type TouchEvent } from "react";

const SWIPE_THRESHOLD = 50;

// 手機分頁共用手勢：使用 touchend 而非 pointerup（頁面捲動時 pointer 會被取消）。
// 不阻止原生捲動；若手勢真的捲動了程式碼或範例區塊，就不切換分頁。
export function useHorizontalSwipe(onSwipe: (direction: "left" | "right") => void) {
  const startRef = useRef<{
    x: number;
    y: number;
    time: number;
    scroller: HTMLElement | null;
    scrollLeft: number;
  } | null>(null);

  function onTouchStart(event: TouchEvent<HTMLElement>) {
    startRef.current = null;
    if (window.innerWidth >= 1024 || event.touches.length !== 1) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("[data-no-swipe], input, textarea, select, button, a")) return;
    const scroller = target.closest<HTMLElement>(".cm-scroller, .overflow-x-auto");
    const touch = event.touches[0];
    startRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      scroller,
      scrollLeft: scroller?.scrollLeft ?? 0,
    };
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = startRef.current;
    startRef.current = null;
    if (!start || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (Date.now() - start.time > 700) return;
    if (start.scroller && start.scroller.scrollLeft !== start.scrollLeft) return;
    onSwipe(dx < 0 ? "left" : "right");
  }

  function onTouchCancel() {
    startRef.current = null;
  }

  return { onTouchStart, onTouchEnd, onTouchCancel };
}
