import { createHash, randomBytes } from "node:crypto";
import { appUrl } from "@/lib/googleOAuth";

const RESET_TOKEN_TTL_MS = 30 * 60_000;

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export function createPasswordResetToken() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function passwordResetConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendPasswordResetEmail({
  email,
  username,
  token,
  request,
}: {
  email: string;
  username: string;
  token: string;
  request: Request;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) return false;

  const resetUrl = new URL("/reset-password", appUrl(request));
  resetUrl.searchParams.set("token", token);
  const safeUsername = escapeHtml(username);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "重設你的 itouOJ 密碼",
        html: `<p>${safeUsername}，你好：</p><p>請在 30 分鐘內點擊下方連結重設密碼：</p><p><a href="${resetUrl.toString()}">重設密碼</a></p><p>若不是你提出的要求，請忽略這封信。</p>`,
        text: `${username}，你好：\n\n請在 30 分鐘內開啟以下連結重設 itouOJ 密碼：\n${resetUrl.toString()}\n\n若不是你提出的要求，請忽略這封信。`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn("Resend rejected a password reset email", { status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    console.warn("Password reset email request failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}
