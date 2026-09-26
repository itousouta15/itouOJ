"use client";

import { Children, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

const DEFAULT_DESCRIPTION_SHARE = (4 / 7) * 100;
const MIN_DESCRIPTION_SHARE = 35;
const MAX_DESCRIPTION_SHARE = 65;

export default function ProblemWorkspace({
  children,
  enabled = true,
  contest = false,
}: {
  children: ReactNode;
  enabled?: boolean;
  contest?: boolean;
}) {
  const [descriptionShare, setDescriptionShare] = useState(DEFAULT_DESCRIPTION_SHARE);
  const [dragging, setDragging] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const description = workspaceRef.current?.querySelector<HTMLElement>("section.problem-workspace-pane");
    if (!description) return;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const showScrollbar = () => {
      description.dataset.scrolling = "true";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        delete description.dataset.scrolling;
      }, 300);
    };
    description.addEventListener("scroll", showScrollbar, { passive: true });
    return () => {
      description.removeEventListener("scroll", showScrollbar);
      clearTimeout(hideTimer);
      delete description.dataset.scrolling;
    };
  }, [enabled]);

  if (!enabled) return <div className="space-y-6">{children}</div>;

  const [description, editor] = Children.toArray(children);
  const style = {
    "--problem-share": `${descriptionShare}fr`,
    "--code-share": `${100 - descriptionShare}fr`,
  } as CSSProperties;

  function updateShare(event: PointerEvent<HTMLDivElement>) {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    // 分隔線 16px、左右各 4px 間距；游標落在分隔線中央時與實際欄寬對齊。
    const availableWidth = bounds.width - 24;
    const descriptionWidth = event.clientX - bounds.left - 12;
    setDescriptionShare(
      Math.max(
        MIN_DESCRIPTION_SHARE,
        Math.min(MAX_DESCRIPTION_SHARE, (descriptionWidth / availableWidth) * 100),
      ),
    );
  }

  return (
    <div
      ref={workspaceRef}
      className={`problem-workspace${contest ? " problem-workspace--contest" : ""}`}
      style={style}
    >
      {description}
      <div
        className="problem-workspace-divider"
        role="separator"
        aria-label="調整題目與程式區寬度"
        aria-orientation="vertical"
        aria-valuemin={MIN_DESCRIPTION_SHARE}
        aria-valuemax={MAX_DESCRIPTION_SHARE}
        aria-valuenow={Math.round(descriptionShare)}
        tabIndex={0}
        title="拖曳調整寬度，雙擊還原 4:3"
        data-dragging={dragging}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) updateShare(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          setDragging(false);
        }}
        onLostPointerCapture={() => setDragging(false)}
        onDoubleClick={() => setDescriptionShare(DEFAULT_DESCRIPTION_SHARE)}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            setDescriptionShare((share) =>
              Math.max(
                MIN_DESCRIPTION_SHARE,
                Math.min(MAX_DESCRIPTION_SHARE, share + (event.key === "ArrowRight" ? 2 : -2)),
              ),
            );
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            setDescriptionShare(event.key === "Home" ? MIN_DESCRIPTION_SHARE : MAX_DESCRIPTION_SHARE);
          }
        }}
      />
      {editor}
    </div>
  );
}
