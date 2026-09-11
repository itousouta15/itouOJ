"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// SSR / 首次 hydration 回傳 false，掛載後回傳 true。
// 用 useSyncExternalStore 取代 useEffect + setState，避免
// react-hooks/set-state-in-effect（React Compiler）警告。
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
