export class ReportRequestError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

// Bound streamed bodies as well as requests with Content-Length before parsing.
export async function readReportJson(request: Request): Promise<unknown> {
  const maxBytes = 48 * 1024;
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new ReportRequestError("回報內容過大", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new ReportRequestError("請提供回報內容");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new ReportRequestError("回報內容過大", 413);
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
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ReportRequestError("回報資料格式錯誤");
  }
}

export function reportErrorResponse(error: unknown) {
  return error instanceof ReportRequestError
    ? Response.json({ error: error.message }, { status: error.status })
    : Response.json({ error: "儲存失敗，請稍後再試" }, { status: 500 });
}
