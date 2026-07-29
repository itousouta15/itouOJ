import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const IV_LEN = 16;

// AES-256-CBC，不是 GCM：收件程式是 .NET Framework 4.x，沒有內建的 AesGcm
// （那是 .NET Core 3.0+ 才有的 API），CBC 才是雙邊都不必額外裝套件就能用的交集。
// 這裡要的只是「賽前不給看」的機密性，不是防篡改，CBC 沒有內建 MAC 這件事
// 在這個用途上不是問題。
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
