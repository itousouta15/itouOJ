import { z } from "zod";

export const RECOGNITION_CATEGORIES = ["C", "Python"] as const;

export const recognitionQuestionSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "程式碼不能是空的")
    .max(20000, "程式碼最多 20000 個字元"),
  question: z
    .string()
    .trim()
    .min(1, "題目文字不能是空的")
    .max(500, "題目文字最多 500 個字元"),
  category: z.enum(RECOGNITION_CATEGORIES),
  options: z
    .array(z.string().trim().min(1, "選項不能是空的"))
    .min(2, "至少需要兩個選項")
    .max(8, "選項最多 8 個"),
  answerIndex: z
    .number()
    .int()
    .min(0, "正確答案超出範圍"),
  explanation: z.string().trim().max(2000, "說明最多 2000 個字元").optional(),
  isPublic: z.boolean(),
  order: z.number().int().min(0),
});

export type RecognitionQuestionInput = z.infer<
  typeof recognitionQuestionSchema
>;