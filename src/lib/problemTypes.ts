export const PROBLEM_TYPES = ["PROGRAMMING", "RECOGNITION"] as const;
export type ProblemType = (typeof PROBLEM_TYPES)[number];

// 識別題的分類（練習頁總覽用）
export const RECOGNITION_CATEGORIES = ["C", "Python"] as const;

export function isRecognitionType(type: string | null | undefined): boolean {
  return type === "RECOGNITION";
}

export interface ProblemLinkInfo {
  type: string;
  order: number;
  id: number;
}

// 依題型產生題目詳情頁連結：
// 實作題 /problems/{order}、識別題 /recognition/q/{id}（兩套編號各自獨立）。
export function problemHref(p: ProblemLinkInfo): string {
  return isRecognitionType(p.type)
    ? `/recognition/q/${p.id}`
    : `/problems/${p.order}`;
}
