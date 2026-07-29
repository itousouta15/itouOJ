import { z } from "zod";
import { problemBaseFields } from "./problemSchema";

// 申請出題沒有子題功能（核准後一律建立成沒有子題的一般題目），所以不共用
// problemSchema 本體，只共用共用欄位定義。
export const problemProposalSchema = z.object({
  ...problemBaseFields,
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

export type ProblemProposalInput = z.infer<typeof problemProposalSchema>;
