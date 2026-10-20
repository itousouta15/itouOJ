import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "錯誤回報",
  robots: { index: false, follow: false },
};
export default function ReportsLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl space-y-6">{children}</div>;
}
