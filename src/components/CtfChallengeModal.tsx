"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { lockBodyScroll } from "@/lib/bodyScrollLock";

let activeModals = 0;
let returnFocus: HTMLElement | null = null;

export default function CtfChallengeModal({ titleId, children }: { titleId: string; children: React.ReactNode }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const disposing = useRef(false);
  const backdropStart = useRef(false);
  const dismiss = useCallback(() => {
    if (closing.current || disposing.current) return;
    closing.current = true;
    router.back();
  }, [router]);

  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (activeModals === 0) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    activeModals++;
    const unlock = lockBodyScroll();
    disposing.current = false;
    closing.current = false;
    if (!element.open) element.showModal();
    closeButton.current?.focus({ preventScroll: true });
    return () => {
      disposing.current = true;
      if (element.open) element.close();
      unlock();
      if (--activeModals === 0) {
        const target = returnFocus?.isConnected ? returnFocus : document.getElementById("ctf-board-title");
        returnFocus = null;
        target?.focus({ preventScroll: true });
      }
    };
  }, []);

  return <dialog ref={dialog} className="ctf-modal" aria-labelledby={titleId} aria-modal="true"
    onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const targets = [...event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
        .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
      if (!targets.length) return;
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onCancel={(event) => { event.preventDefault(); dismiss(); }}
    onClose={() => { if (!dialog.current?.open) dismiss(); }}
    onPointerDown={(event) => { backdropStart.current = event.target === event.currentTarget; }}
    onClick={(event) => { if (backdropStart.current && event.target === event.currentTarget) dismiss(); }}>
    <div className="ctf-modal-surface">
      <button ref={closeButton} type="button" className="ctf-modal-close" aria-label="關閉題目" onClick={dismiss}>×</button>
      {children}
    </div>
  </dialog>;
}
