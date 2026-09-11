import { z } from "zod";
import { PROBLEM_TYPES } from "@/lib/problemTypes";

// 題目共用欄位。獨立匯出給 problemProposalSchema 用，因為 problemSchema
// 帶了 .superRefine()，zod 不允許對它呼叫 .omit()。
export const problemBaseFields = {
  title: z.string().min(1, "標題不能是空的").max(200),
  statement: z.string().min(1, "題敘不能是空的"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeLimitMs: z.number().int().min(100).max(20000),
  memoryLimitMb: z.number().int().min(16).max(1024),
};

// 兩種題型共用同一份 schema：PROGRAMMING 維持原有驗證，RECOGNITION
// 不要求測資、改驗選項與答案；切換題型時另一邊的欄位由 API 清掉。
export const problemSchema = z
  .object({
    ...problemBaseFields,
    type: z.enum(PROBLEM_TYPES).default("PROGRAMMING"),
    isPublic: z.boolean(),
    tagIds: z.array(z.number().int()).default([]),
    // PDF 三態：key 沒出現 = 不動、null = 移除、有值 = 換新檔。表單每次存檔
    // 都送整份資料，沒有這個區分的話改個標題錯字就會把 PDF 弄丟。
    pdfUpload: z
      .object({
        filename: z.string().min(1).max(200),
        base64: z.string().min(1),
        // 選填：有給的話存檔時加密 PDF，開賽前佈署到選手機也打不開
        password: z.string().max(200).nullable().optional(),
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
      .default([]),
    // 識別題欄位（type = RECOGNITION 才有意義）：
    code: z.string().max(30000, "程式碼最多 30000 個字元").optional(),
    options: z
      .array(z.string().trim().min(1, "選項不能是空的"))
      .min(2, "至少需要兩個選項")
      .max(8, "選項最多 8 個")
      .optional(),
    answerIndex: z.number().int().min(0).nullable().optional(),
    explanation: z.string().trim().max(10000, "說明最多 10000 個字元").optional(),
    paper: z.string().trim().max(50, "卷別最多 50 個字元").optional(),
    sourceNumber: z.number().int().min(0).nullable().optional(),
    category: z.string().trim().max(20, "分類最多 20 個字元").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "RECOGNITION") {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "識別題至少要有兩個選項",
          path: ["options"],
        });
        return;
      }
      if (
        data.answerIndex == null ||
        data.answerIndex < 0 ||
        data.answerIndex >= data.options.length
      ) {
        ctx.addIssue({
          code: "custom",
          message: "正確答案超出選項範圍",
          path: ["answerIndex"],
        });
      }
      return;
    }

    if (data.testCases.length < 1) {
      ctx.addIssue({
        code: "custom",
        message: "至少要有一筆測資",
        path: ["testCases"],
      });
    }
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
