import { z } from "zod";
import { isLanguageKey } from "./languages";

export const problemCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "留言不能是空的")
    .max(5000, "留言不能超過 5000 字"),
  // 有值 = 這是對某則留言的回覆。只做一層，回覆的回覆會被歸到同一串底下
  // （見 API 路由把 parentId 正規化到最上層那段）。
  parentId: z.number().int().nullable().optional(),
});

export const problemSolutionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "標題不能是空的")
      .max(200, "標題不能超過 200 字"),
    content: z
      .string()
      .trim()
      .min(1, "解題想法不能是空的")
      .max(20000, "內容不能超過 20000 字"),
    code: z.string().max(50000, "程式碼不能超過 50000 字").nullable().optional(),
    language: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    // 語言只在真的有附程式碼時才有意義，也才需要驗。空字串當成沒填，
    // 因為表單的 select 在「不附程式碼」時送過來就是空字串。
    const code = data.code?.trim();
    if (!code) return;
    if (!data.language || !isLanguageKey(data.language)) {
      ctx.addIssue({
        code: "custom",
        path: ["language"],
        message: "附程式碼時請選擇語言",
      });
    }
  });

export type ProblemCommentInput = z.infer<typeof problemCommentSchema>;
export type ProblemSolutionInput = z.infer<typeof problemSolutionSchema>;
