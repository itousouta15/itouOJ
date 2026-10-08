import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { normalizeCtfFlag } from "@/lib/ctfFlag";

export class CtfLabFlagError extends Error {
  constructor() { super("練習網站的 Flag 設定異常，請管理員重新設定 Flag"); }
}

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new CtfLabFlagError();
  return createHash("sha256").update("itouoj:ctf-web-lab:v1\0").update(secret).digest();
}

// Labs must reveal the answer at the intended puzzle endpoint, so keep a separate
// authenticated encrypted copy. Binding to the salted hash prevents envelope swaps.
export function encryptCtfLabFlag(flag: string, flagHash: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(`ctf-web-lab:v1:${flagHash}`));
  const bytes = Buffer.concat([cipher.update(normalizeCtfFlag(flag), "utf8"), cipher.final()]);
  return `v1.${Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString("base64url")}`;
}

export function decryptCtfLabFlag(envelope: string, flagHash: string): string {
  try {
    if (!/^v1\.[A-Za-z0-9_-]+$/.test(envelope)) throw new Error("Invalid envelope");
    const bytes = Buffer.from(envelope.slice(3), "base64url");
    if (bytes.length <= 28) throw new Error("Invalid length");
    const decipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(`ctf-web-lab:v1:${flagHash}`));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
  } catch { throw new CtfLabFlagError(); }
}
