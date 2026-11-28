export const CTF_ATTACHMENT_MAX_BYTES = 4 * 1024 * 1024;
export const CTF_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const CTF_METADATA_MAX_BYTES = 1024 * 1024;
export const CTF_ATTEMPT_MAX_BYTES = 8 * 1024;

export class CtfRequestError extends Error {
  constructor(message: string, public readonly status: number = 400) {
    super(message);
  }
}

// Bound actual bytes before JSON/multipart parsing, including chunked requests.
export async function readCtfBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new CtfRequestError("請求資料太大", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        // Next.js cancellation can destroy the HTTP socket before a 413 is
        // written. Stop reading and release the lock so the error can reach the
        // client; never retain or parse the remainder of this request.
        throw new CtfRequestError("請求資料太大", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readCtfJson(request: Request, maxBytes: number): Promise<unknown> {
  const bytes = await readCtfBody(request, maxBytes);
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new CtfRequestError("請提供有效的 JSON");
  }
}

export function ctfFilename(filename: string): string {
  const name = filename.trim();
  if (!name || name === "." || name === ".." || name.length > 200 || /[\x00-\x1f\x7f/\\]/.test(name)) {
    throw new CtfRequestError("檔名不合法，請移除路徑及控制字元");
  }
  // Reject malformed Unicode before constructing an HTTP header.
  try { encodeURIComponent(name); } catch { throw new CtfRequestError("檔名不合法"); }
  return name;
}

export function ctfDownloadHeaders(filename: string) {
  const encoded = encodeURIComponent(ctfFilename(filename)).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return {
    "Content-Type": "application/octet-stream",
    "Content-Disposition": `attachment; filename="download"; filename*=UTF-8''${encoded}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export function ctfErrorResponse(error: unknown): Response {
  if (error instanceof CtfRequestError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
