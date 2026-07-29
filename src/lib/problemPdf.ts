import { encryptPdf } from "@/lib/pdfCrypto";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export class PdfUploadError extends Error {}

// 把 problemSchema 裡的三態 pdfUpload 轉成 Prisma update data 的片段。
// 回傳空物件 {} 時代表「這幾個欄位不要動」——Prisma 的 update 只會寫入
// 有出現在 data 裡的欄位，省略掉的欄位維持資料庫原本的值。
export function pdfUpdateData(
  pdfUpload: { filename: string; base64: string; password?: string | null } | null | undefined
): {
  pdfData?: Uint8Array<ArrayBuffer> | null;
  pdfFilename?: string | null;
  pdfUploadedAt?: Date | null;
  pdfPassword?: string | null;
} {
  if (pdfUpload === undefined) return {};
  if (pdfUpload === null) {
    return { pdfData: null, pdfFilename: null, pdfUploadedAt: null, pdfPassword: null };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(pdfUpload.base64, "base64");
  } catch {
    throw new PdfUploadError("PDF 檔案內容無法解析");
  }
  if (buffer.length === 0) {
    throw new PdfUploadError("PDF 檔案是空的");
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new PdfUploadError(`PDF 檔案不能超過 ${MAX_PDF_BYTES / 1024 / 1024} MB`);
  }

  // 有給密碼就整份加密後再存——密碼本身也存起來，開賽前把加密檔跟密碼
  // 一起佈署到選手機上，收件程式收到才能在開賽那一刻自動解密開啟。
  const password = pdfUpload.password?.trim() || null;
  const stored = password ? encryptPdf(buffer, password) : buffer;

  // Prisma 的 Bytes 欄位要的型別是 Uint8Array<ArrayBuffer>，但 @types/node 底下
  // Uint8Array 的建構子（包含 `new Uint8Array(length)`）一律推斷成
  // Uint8Array<ArrayBufferLike>（涵蓋 SharedArrayBuffer），型別層級上永遠對不上，
  // 即使執行期這裡配置的就是一塊單純的 ArrayBuffer。這是 TS 5.7 之後
  // ArrayBuffer 泛型化跟 @types/node 之間已知的落差，用型別斷言收尾。
  const data = new Uint8Array(stored.length);
  data.set(stored);
  return {
    pdfData: data as Uint8Array<ArrayBuffer>,
    pdfFilename: pdfUpload.filename,
    pdfUploadedAt: new Date(),
    pdfPassword: password,
  };
}
