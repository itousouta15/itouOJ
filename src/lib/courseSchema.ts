import { z } from "zod";

export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "請輸入課程標題")
    .max(100, "標題最多 100 個字元"),
  description: z.string().trim().max(2000, "說明最多 2000 個字元"),
  isPublic: z.boolean(),
  // 空字串 = 開放加入；有值 = 要輸入代碼才能加入
  joinCode: z.string().trim().max(32, "加入代碼最多 32 個字元").default(""),
  problemIds: z
    .array(z.number().int().positive())
    .max(200, "題目數量過多")
    .refine((ids) => new Set(ids).size === ids.length, "課程題目不可重複"),
});

export const courseOrderSchema = z
  .object({
    ids: z.array(z.number().int().positive()).min(1).max(5000),
    expectedIds: z.array(z.number().int().positive()).min(1).max(5000),
  })
  .refine(({ ids, expectedIds }) => {
    const expected = new Set(expectedIds);
    return (
      new Set(ids).size === ids.length &&
      expected.size === expectedIds.length &&
      ids.length === expectedIds.length &&
      ids.every((id) => expected.has(id))
    );
  }, "課程順序資料不完整或有重複");

export type CourseFormData = z.infer<typeof courseSchema>;
