"use client";

import { usePathname } from "next/navigation";

// 以 pathname 當 key，每次路由切換重新掛載，重播 .page-transition 的進場動畫。
// （root template.tsx 只在第一層 segment 變化時重掛，/problems → /problems/1 不會動）
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}
