import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "標題不能是空的").max(200),
  content: z.string().min(1, "內容不能是空的"),
  isPinned: z.boolean(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;
