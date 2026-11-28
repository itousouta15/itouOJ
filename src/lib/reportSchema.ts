import { z } from "zod";

export const REPORT_CATEGORIES = {
  LESSON: "教學內容",
  PROBLEM: "題目／測資",
  JUDGE: "提交／評測",
  WEBSITE: "網站功能",
  OTHER: "其他",
} as const;
export const REPORT_SECTIONS = {
  GENERAL: "整體／其他",
  EXPLANATION: "解題思路／文字說明",
  ANIMATION: "動畫步驟",
  CPP: "C++ 程式",
  PYTHON: "Python 程式",
  SAMPLE: "範例輸入／輸出",
} as const;
export const REPORT_STATUSES = {
  OPEN: "待處理",
  IN_PROGRESS: "處理中",
  RESOLVED: "已修正",
  CLOSED: "已結案",
} as const;
export const reportCategorySchema = z.enum(
  Object.keys(REPORT_CATEGORIES) as [
    keyof typeof REPORT_CATEGORIES,
    ...(keyof typeof REPORT_CATEGORIES)[],
  ],
);
export const reportSectionSchema = z.enum(
  Object.keys(REPORT_SECTIONS) as [
    keyof typeof REPORT_SECTIONS,
    ...(keyof typeof REPORT_SECTIONS)[],
  ],
);
export const reportStatusSchema = z.enum(
  Object.keys(REPORT_STATUSES) as [
    keyof typeof REPORT_STATUSES,
    ...(keyof typeof REPORT_STATUSES)[],
  ],
);

// Store only a local pathname: never retain query tokens, hashes, or external URLs.
export function reportSourcePath(value: string): string | null {
  if (!value) return "";
  if (
    value.length > 2000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u001f\u007f]/.test(value)
  )
    return null;
  try {
    const url = new URL(value, "https://report.invalid");
    const decoded = decodeURIComponent(url.pathname);
    if (
      url.origin !== "https://report.invalid" ||
      decoded.startsWith("//") ||
      /[\\\u0000-\u001f\u007f]/.test(decoded)
    )
      return null;
    return url.pathname;
  } catch {
    return null;
  }
}

export const reportCreateSchema = z
  .object({
    category: reportCategorySchema,
    section: reportSectionSchema.default("GENERAL"),
    title: z
      .string()
      .trim()
      .min(1, "請填寫回報標題")
      .max(120, "標題最多 120 字"),
    description: z
      .string()
      .trim()
      .min(10, "請至少用 10 個字說明問題與重現步驟")
      .max(5000, "問題說明最多 5000 字"),
    expected: z.string().trim().max(2000, "預期結果最多 2000 字").default(""),
    sourcePath: z
      .string()
      .max(2000)
      .refine(
        (value) => reportSourcePath(value) !== null,
        "請提供站內頁面路徑，例如 /courses/cpe/lessons/a460",
      )
      .transform((value) => reportSourcePath(value)!)
      .default(""),
    context: z.string().trim().max(300, "來源補充最多 300 字").default(""),
  })
  .strict();

export const reportUpdateSchema = z
  .object({
    status: reportStatusSchema,
    adminReply: z.string().trim().max(3000, "處理回覆最多 3000 字"),
    expectedUpdatedAt: z.iso.datetime(),
  })
  .strict();

export function reportCategoryForPath(
  path: string,
): keyof typeof REPORT_CATEGORIES {
  if (path.startsWith("/courses/")) return "LESSON";
  if (/^\/(problems|recognition)(\/|$)/.test(path)) return "PROBLEM";
  if (path.startsWith("/submissions")) return "JUDGE";
  return "WEBSITE";
}

export type ReportCreateInput = z.input<typeof reportCreateSchema>;
export type ReportSearchParams = Record<string, string | string[] | undefined>;
export function reportFilters(params: ReportSearchParams) {
  const value = (key: string) =>
    typeof params[key] === "string" ? params[key] : "";
  const status = reportStatusSchema.safeParse(value("status"));
  const category = reportCategorySchema.safeParse(value("category"));
  const page = Number(value("page"));
  return {
    status: status.success ? status.data : undefined,
    category: category.success ? category.data : undefined,
    query: value("q").trim().slice(0, 120),
    page: Number.isSafeInteger(page) && page > 0 && page <= 50000 ? page : 1,
  };
}
