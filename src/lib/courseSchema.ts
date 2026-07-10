import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(1, "請輸入課程標題").max(100, "標題最多 100 個字元"),
  description: z.string().trim().max(2000, "說明最多 2000 個字元"),
  isPublic: z.boolean(),
  // 空字串 = 開放加入；有值 = 要輸入代碼才能加入
  joinCode: z.string().trim().max(32, "加入代碼最多 32 個字元").default(""),
  problemIds: z.array(z.number().int()).max(200, "題目數量過多"),
});

export type CourseFormData = z.infer<typeof courseSchema>;
