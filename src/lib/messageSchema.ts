import { z } from "zod";

export const messageSchema = z.object({
  // 收件者用 username 指名（前端只知道網址上的 username，不是資料庫 id）
  to: z.string().trim().min(1, "請選擇收件者"),
  content: z
    .string()
    .trim()
    .min(1, "訊息不能是空的")
    .max(5000, "訊息不能超過 5000 字"),
});
