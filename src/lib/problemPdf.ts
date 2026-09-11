import { encryptPdf } from "@/lib/pdfCrypto";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export class PdfUploadError extends Error {}

// 把三態的 pdfUpload 轉成 Prisma update data；undefined = 欄位不動。
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

  // 有給密碼就整份加密後再存；密碼也一起佈署到選手機，開賽時才能自動解密。
  const password = pdfUpload.password?.trim() || null;
  const stored = password ? encryptPdf(buffer, password) : buffer;

  // TS 5.7 之後 @types/node 的 Uint8Array 泛型對不上 Prisma 要的型別，
  // 執行期是對的，用斷言收尾。
  const data = new Uint8Array(stored.length);
  data.set(stored);
  return {
    pdfData: data as Uint8Array<ArrayBuffer>,
    pdfFilename: pdfUpload.filename,
    pdfUploadedAt: new Date(),
    pdfPassword: password,
  };
}
