import { z } from "zod";

export const contestSchema = z
  .object({
    title: z.string().trim().min(1, "請輸入比賽標題").max(100, "標題最多 100 個字元"),
    description: z.string().trim().max(2000, "說明最多 2000 個字元"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    freezeMinutes: z.number().int().min(0, "凍結時間不能是負的"),
    isPublic: z.boolean(),
    // 空字串 = 開放報名；有值 = 要輸入代碼才能報名
    joinCode: z.string().trim().max(32, "加入代碼最多 32 個字元").default(""),
    problems: z
      .array(
        z.object({
          problemId: z.number().int(),
          label: z.string().trim().min(1, "題目代號不能是空的").max(4, "題目代號最多 4 個字元"),
        })
      )
      .max(50, "題目數量過多"),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "結束時間必須晚於開始時間",
    path: ["endTime"],
  })
  .refine(
    (v) => v.freezeMinutes * 60_000 <= v.endTime.getTime() - v.startTime.getTime(),
    { message: "凍結時間不能長過整場比賽", path: ["freezeMinutes"] }
  )
  .refine(
    (v) => new Set(v.problems.map((p) => p.label.toUpperCase())).size === v.problems.length,
    { message: "題目代號不能重複", path: ["problems"] }
  )
  .refine(
    (v) => new Set(v.problems.map((p) => p.problemId)).size === v.problems.length,
    { message: "同一題不能加入兩次", path: ["problems"] }
  );

export type ContestFormData = z.infer<typeof contestSchema>;
