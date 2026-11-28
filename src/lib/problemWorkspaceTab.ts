"use client";

import { useEffect, useState } from "react";

// 程式題手機版的分頁狀態（題目 / 程式）需要同時被兩個地方讀寫：
// - 題目頁內的 ProblemWorkspace（實際切換內容）
// - 全站底部導覽列的 BottomNavLinks（把分頁按鈕顯示在導覽列上）
// 兩者不在同一棵 React 樹，所以用自訂 DOM 事件當輕量的事件匯流排。
export type ProblemWorkspaceTab = "problem" | "code";

type WorkspaceState = { active: boolean; tab: ProblemWorkspaceTab; codeVisited: boolean };

const EVENT = "problem-workspace-tab";
let current: WorkspaceState = { active: false, tab: "problem", codeVisited: false };

function publish(next: WorkspaceState) {
  current = next;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<WorkspaceState>(EVENT, { detail: next }));
}

export function setProblemWorkspaceTab(tab: ProblemWorkspaceTab) {
  publish({ ...current, tab, codeVisited: current.codeVisited || tab === "code" });
}

export function setProblemWorkspaceEditorVisited() {
  if (!current.codeVisited) publish({ ...current, codeVisited: true });
}

// ProblemWorkspace 掛載 / 卸載時宣告自己存在與否，導覽列才知道要不要顯示分頁按鈕。
export function setProblemWorkspaceActive(active: boolean) {
  publish({ active, tab: "problem", codeVisited: false });
}

export function useProblemWorkspaceState(): WorkspaceState {
  const [state, setState] = useState<WorkspaceState>(current);
  useEffect(() => {
    const onChange = (event: Event) => {
      setState((event as CustomEvent<WorkspaceState>).detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return state;
}
