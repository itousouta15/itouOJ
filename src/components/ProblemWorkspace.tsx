"use client";

import {
  Children,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  setProblemWorkspaceTab,
  setProblemWorkspaceActive,
  useProblemWorkspaceState,
  type ProblemWorkspaceTab,
} from "@/lib/problemWorkspaceTab";

const DEFAULT_DESCRIPTION_SHARE = (4 / 7) * 100;
const MIN_DESCRIPTION_SHARE = 35;
const MAX_DESCRIPTION_SHARE = 65;

// 手機左右滑分頁：要超過這個水平位移、且大於垂直位移，才判定為翻頁，
// 避免跟頁面垂直捲動、編輯器水平捲動打架。
const SWIPE_THRESHOLD = 50;

type MobileTab = ProblemWorkspaceTab;

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

  const items = Children.toArray(children);
  // 只有兩個 pane（題目 + 編輯器）才做分頁；未登入只有題目，維持堆疊。
  const hasTwoPanes = enabled && items.length === 2;
  // 分頁狀態與全站底部導覽列共用（見 lib/problemWorkspaceTab.ts）。
  const { tab: mobileTab } = useProblemWorkspaceState();
  const [slideDirection, setSlideDirection] = useState<MobileTab | null>(null);
  const prevTabRef = useRef<MobileTab>(mobileTab);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // 不論是滑動或點底部導覽列切換，都依切換方向播放滑入動畫。
  useEffect(() => {
    if (prevTabRef.current !== mobileTab) {
      setSlideDirection(mobileTab);
      prevTabRef.current = mobileTab;
    }
  }, [mobileTab]);

  // 掛載時告訴底部導覽列「這裡有程式題分頁」，卸載時收回。
  useEffect(() => {
    if (!hasTwoPanes) return;
    setProblemWorkspaceActive(true);
    return () => setProblemWorkspaceActive(false);
  }, [hasTwoPanes]);

  useEffect(() => {
    if (!enabled) return;
    const description = workspaceRef.current?.querySelector<HTMLElement>(
      "section.problem-workspace-pane",
    );
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

  function dividerPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function dividerPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) updateShare(event);
  }

  function dividerPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  function dividerKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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
      setDescriptionShare(
        event.key === "Home" ? MIN_DESCRIPTION_SHARE : MAX_DESCRIPTION_SHARE,
      );
    }
  }

  const divider = (
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
      onPointerDown={dividerPointerDown}
      onPointerMove={dividerPointerMove}
      onPointerUp={dividerPointerUp}
      onLostPointerCapture={() => setDragging(false)}
      onDoubleClick={() => setDescriptionShare(DEFAULT_DESCRIPTION_SHARE)}
      onKeyDown={dividerKeyDown}
    />
  );

  if (!enabled) return <div className="space-y-6">{children}</div>;

  const [description, editor] = items;
  const style = {
    "--problem-share": `${descriptionShare}fr`,
    "--code-share": `${100 - descriptionShare}fr`,
  } as CSSProperties;

  // ---- 手機分頁模式：兩個 pane 都有時，左右滑切換題目 / 程式 ----
  if (hasTwoPanes) {
    function showTab(tab: MobileTab) {
      setProblemWorkspaceTab(tab);
    }

    function onPointerDown(event: PointerEvent<HTMLDivElement>) {
      if (event.pointerType === "mouse") return;
      // 從編輯器或可橫向捲動的區塊起始的手勢不翻頁（那是使用者在選字/滑程式碼）。
      if ((event.target as HTMLElement).closest(".cm-editor, [data-no-swipe]")) return;
      touchStart.current = { x: event.clientX, y: event.clientY };
    }

    function onPointerUp(event: PointerEvent<HTMLDivElement>) {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
      // 左滑（dx<0）→ 看題目；右滑（dx>0）→ 寫程式。
      showTab(dx < 0 ? "problem" : "code");
    }

    return (
      <div
        ref={workspaceRef}
        className={`problem-workspace problem-workspace--tabs${
          contest ? " problem-workspace--contest" : ""
        }`}
        style={style}
        data-mobile-tab={mobileTab}
      >
        <div
          className="problem-pages"
          data-direction={slideDirection ?? undefined}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className={`problem-page${mobileTab === "problem" ? " is-active" : ""}`}>
            {description}
          </div>
          {divider}
          <div className={`problem-page${mobileTab === "code" ? " is-active" : ""}`}>
            {editor}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={workspaceRef}
      className={`problem-workspace${contest ? " problem-workspace--contest" : ""}`}
      style={style}
    >
      {description}
      {divider}
      {editor}
    </div>
  );
}
