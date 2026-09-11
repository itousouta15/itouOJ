import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const IV_LEN = 16;

// 用 AES-256-CBC 而非 GCM：收件程式的 .NET Framework 4.x 沒有 AesGcm。
// 這裡只求「賽前不給看」的機密性，不做防篡改。
function deriveKey(password: string): Buffer {
  return createHash("sha256").update(password, "utf8").digest();
}

// 回傳格式：[iv 16 bytes][密文]。iv 不是機密，跟密文存在一起即可。
export function encryptPdf(data: Buffer, password: string): Buffer {
  const key = deriveKey(password);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, ciphertext]);
}

export function decryptPdf(blob: Buffer, password: string): Buffer {
  const key = deriveKey(password);
  const iv = blob.subarray(0, IV_LEN);
  const ciphertext = blob.subarray(IV_LEN);
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
