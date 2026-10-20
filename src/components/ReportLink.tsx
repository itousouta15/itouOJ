"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReportCreateInput } from "@/lib/reportSchema";

export default function ReportLink({
  category,
  section = "GENERAL",
  title = "",
  context = "",
  label = "回報錯誤",
  className = "text-sm text-blue hover:underline",
}: {
  category?: ReportCreateInput["category"];
  section?: ReportCreateInput["section"];
  title?: string;
  context?: string;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname() || "/";
  const inferred = pathname.startsWith("/courses/")
    ? "LESSON"
    : /^\/(problems|recognition)(\/|$)/.test(pathname)
      ? "PROBLEM"
      : pathname.startsWith("/submissions")
        ? "JUDGE"
        : "WEBSITE";
  const query = new URLSearchParams({
    category: category ?? inferred,
    section,
    source: pathname,
  });
  if (title) query.set("title", title.slice(0, 120));
  if (context) query.set("context", context.slice(0, 300));
  return (
    <Link href={`/reports/new?${query}`} className={className} prefetch={false}>
      {label}
    </Link>
  );
}
