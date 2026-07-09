import { z } from "zod";

export const problemSchema = z.object({
  title: z.string().min(1, "標題不能是空的").max(200),
  statement: z.string().min(1, "題敘不能是空的"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimitMs: z.number().int().min(100).max(20000),
  memoryLimitMb: z.number().int().min(16).max(1024),
  isPublic: z.boolean(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        isSample: z.boolean(),
      })
    )
    .min(1, "至少要有一筆測資"),
});

export type ProblemInput = z.infer<typeof problemSchema>;
