import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import ReportForm from "@/components/ReportForm";
import {
  reportCategorySchema,
  reportSectionSchema,
  reportSourcePath,
  reportCategoryForPath,
  type ReportSearchParams,
} from "@/lib/reportSchema";

export const dynamic = "force-dynamic";
export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<ReportSearchParams>;
}) {
  const params = await searchParams;
  const value = (key: string, max: number) =>
    typeof params[key] === "string" ? params[key].slice(0, max) : "";
  const sourcePath = reportSourcePath(value("source", 2000)) ?? "";
  const category = reportCategorySchema.safeParse(value("category", 30));
  const section = reportSectionSchema.safeParse(value("section", 30));
  const initial = {
    category: category.success
      ? category.data
      : reportCategoryForPath(sourcePath),
    section: section.success ? section.data : ("GENERAL" as const),
    title: value("title", 120),
    sourcePath,
    context: value("context", 300),
    description: "",
    expected: "",
  };
  if (!(await getSession())) {
    const query = new URLSearchParams({
      category: initial.category,
      section: initial.section,
      title: initial.title,
      source: sourcePath,
      context: initial.context,
    });
    redirect(`/login?next=${encodeURIComponent(`/reports/new?${query}`)}`);
  }
  return (
    <>
      <header className="space-y-2">
        <Link href="/reports" className="text-sm text-blue hover:underline">
          ← 我的回報
        </Link>
        <h1 className="page-title">回報錯誤</h1>
        <p className="text-sm leading-6 text-dim">
          教學解說、動畫、C++／Python
          程式、題目或網站操作有問題，都可以在這裡回報。管理員的處理結果會顯示在「我的回報」。
        </p>
      </header>
      <ReportForm initial={initial} />
    </>
  );
}
