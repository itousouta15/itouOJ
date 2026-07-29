import { z } from "zod";

// 題目共用欄位。獨立匯出給 problemProposalSchema 用，
// 因為 problemSchema 本身帶 .superRefine()，zod 不允許對有 refinement 的
// object schema 呼叫 .omit()（申請出題不需要子題功能，另外組一份更單純）。
export const problemBaseFields = {
  title: z.string().min(1, "標題不能是空的").max(200),
  statement: z.string().min(1, "題敘不能是空的"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimitMs: z.number().int().min(100).max(20000),
  memoryLimitMb: z.number().int().min(16).max(1024),
};

export const problemSchema = z
  .object({
    ...problemBaseFields,
    isPublic: z.boolean(),
    tagIds: z.array(z.number().int()).default([]),
    // 三態：key 沒出現＝維持原本的 PDF 不動；null＝移除；有值＝換成新檔案。
    // 表單每次存檔都會送整份資料，如果沒有這個區分，改個標題的錯字就會把
    // 已經上傳的 PDF 弄丟（逼使用者每次存檔都要重新選一次檔案）。
    pdfUpload: z
      .object({
        filename: z.string().min(1).max(200),
        base64: z.string().min(1),
      })
      .nullable()
      .optional(),
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
