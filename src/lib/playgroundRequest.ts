import { z } from "zod";
import { LANGUAGE_KEYS } from "@/lib/languages";

const source = z.string().min(1, "程式碼不能是空的").max(65536, "程式碼過長")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 65536, "程式碼過長");

export const playgroundRunSchema = z.object({
  language: z.enum(LANGUAGE_KEYS),
  code: source,
  input: z.string().max(65536, "自訂輸入過長").default("")
    .refine((value) => Buffer.byteLength(value, "utf8") <= 65536, "自訂輸入過長"),
});

export const playgroundTerminalSchema = z.object({
  language: z.enum(["c", "cpp", "python", "javascript"]),
  code: source,
});
