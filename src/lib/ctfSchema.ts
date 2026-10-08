import { z } from "zod";

export const CTF_CATEGORIES = ["Web", "Crypto", "Reverse", "Pwn", "Forensics", "Misc"] as const;
export const CTF_PAGE_SIZE = 20;
export const CTF_FLAG_MAX_LENGTH = 1024;
export const CTF_DIFFICULTIES = { easy: "簡單", medium: "中等", hard: "困難" } as const;
export const CTF_LAB_TYPES = ["SOURCE", "COOKIE", "IDOR"] as const;
export const CTF_LAB_LABELS = { SOURCE: "原始碼小站", COOKIE: "Cookie 會員站", IDOR: "票券收藏站" } as const;

const flag = z.string().trim().max(CTF_FLAG_MAX_LENGTH, "Flag 最多 1024 個字元");
const fields = {
  title: z.string().trim().min(1, "請填寫標題").max(200),
  description: z.string().trim().min(1, "請填寫題目敘述").max(100000),
  category: z.enum(CTF_CATEGORIES),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().int().min(1).max(1000000),
  isPublic: z.boolean().default(false),
  order: z.number().int().min(0).max(2147483647).default(0),
  labType: z.enum(CTF_LAB_TYPES).nullable().optional(),
};
export const ctfCreateSchema = z.object({ ...fields, labType: fields.labType.default(null), flag: flag.min(1, "請設定 Flag") })
  .refine((data) => !data.labType || data.category === "Web", { message: "練習網站只適用於 Web 分類", path: ["labType"] });
export const ctfUpdateSchema = z.object({ ...fields, flag: flag.default("") })
  .refine((data) => !data.labType || data.category === "Web", { message: "練習網站只適用於 Web 分類", path: ["labType"] });
export const ctfAttemptSchema = z.object({ flag: flag.min(1, "請輸入 Flag") });
export const ctfIdSchema = z.coerce.number().int().positive().max(2147483647);
export const ctfQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).catch(1),
  category: z.enum(CTF_CATEGORIES).optional().catch(undefined),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().catch(undefined),
  status: z.enum(["solved", "unsolved"]).optional().catch(undefined),
});
