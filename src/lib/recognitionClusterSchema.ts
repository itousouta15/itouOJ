import { z } from "zod";

export const recognitionClusterSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "群集名稱不能是空的")
    .max(100, "群集名稱最多 100 個字元"),
  description: z.string().trim().max(500, "說明最多 500 個字元").optional().default(""),
  isPublic: z.boolean(),
  // 勾選要加入這個群集的識別題；一題最多屬於一個群集（會被移到這個群集）
  problemIds: z.array(z.number().int()).default([]),
  // 群集標籤（沿用全站 Tag 庫）
  tagIds: z.array(z.number().int()).default([]),
});

export type RecognitionClusterInput = z.infer<typeof recognitionClusterSchema>;
