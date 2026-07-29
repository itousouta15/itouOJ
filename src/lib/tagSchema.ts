import { z } from "zod";

export const tagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "標籤名稱不能是空的")
    .max(30, "標籤名稱最多 30 個字元"),
});

export type TagInput = z.infer<typeof tagSchema>;
