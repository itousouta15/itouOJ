import { z } from "zod";

export const problemSchema = z
  .object({
    title: z.string().min(1, "標題不能是空的").max(200),
    statement: z.string().min(1, "題敘不能是空的"),
    difficulty: z.enum(["easy", "medium", "hard"]),
    timeLimitMs: z.number().int().min(100).max(20000),
    memoryLimitMb: z.number().int().min(16).max(1024),
    isPublic: z.boolean(),
    // 沒有子題 = 沿用舊制整題 AC/WA；有子題則每筆測資都要指定所屬子題，各子題全對才拿到該子題配分
    subtasks: z
      .array(
        z.object({
          points: z.number().int().min(1).max(100),
          checkMode: z.enum(["full", "firstLine"]).default("full"),
        })
      )
      .default([]),
    testCases: z
      .array(
        z.object({
          input: z.string(),
          output: z.string(),
          isSample: z.boolean(),
          subtaskIndex: z.number().int().min(0).nullable().default(null),
        })
      )
      .min(1, "至少要有一筆測資"),
  })
  .superRefine((data, ctx) => {
    if (data.subtasks.length === 0) return;

    const total = data.subtasks.reduce((sum, s) => sum + s.points, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: "custom",
        message: `子題配分總和需為 100（目前 ${total}）`,
        path: ["subtasks"],
      });
    }

    data.testCases.forEach((tc, i) => {
      if (
        tc.subtaskIndex == null ||
        tc.subtaskIndex < 0 ||
        tc.subtaskIndex >= data.subtasks.length
      ) {
        ctx.addIssue({
          code: "custom",
          message: `測資 #${i + 1} 必須指定所屬子題`,
          path: ["testCases", i, "subtaskIndex"],
        });
      }
    });
  });

export type ProblemInput = z.infer<typeof problemSchema>;
