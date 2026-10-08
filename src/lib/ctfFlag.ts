import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const KEY_BYTES = 64;
const OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

export function normalizeCtfFlag(flag: string): string {
  return flag.trim();
}

function derive(flag: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(normalizeCtfFlag(flag), salt, KEY_BYTES, OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashCtfFlag(flag: string) {
  const flagSalt = randomBytes(32).toString("hex");
  return { flagSalt, flagHash: (await derive(flag, flagSalt)).toString("hex") };
}

export async function verifyCtfFlag(flag: string, flagSalt: string, flagHash: string): Promise<boolean> {
  const expected = Buffer.from(flagHash, "hex");
  const actual = await derive(flag, flagSalt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
