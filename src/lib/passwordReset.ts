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
        html: `<div style="max-width:560px;margin:0 auto;font-family:Arial,'Noto Sans TC',sans-serif;color:#202124;line-height:1.7"><h1 style="margin:0 0 24px;font-size:24px">重設 itouOJ 密碼</h1><p>${safeUsername}，你好：</p><p>我們收到你的密碼重設申請。請點擊下方按鈕設定新的密碼。</p><p style="margin:28px 0"><a href="${resetUrl.toString()}" style="display:inline-block;padding:11px 20px;background:#6d8fd8;border-radius:8px;color:#fff;font-weight:700;text-decoration:none">重設密碼</a></p><p>這個連結會在 <strong>30 分鐘後失效</strong>，且只能使用一次。重設完成後，其他裝置上的登入狀態會自動失效。</p><p>如果按鈕無法開啟，請複製以下網址到瀏覽器：<br><a href="${resetUrl.toString()}">${resetUrl.toString()}</a></p><hr style="margin:28px 0;border:0;border-top:1px solid #e5e7eb"><p style="color:#5f6368;font-size:13px">若不是你提出這項申請，請直接忽略這封信；你的密碼不會因此變更。請勿將此連結轉傳給任何人。</p></div>`,
        text: `${username}，你好：\n\n我們收到你的 itouOJ 密碼重設申請。請在 30 分鐘內開啟以下連結設定新密碼：\n${resetUrl.toString()}\n\n此連結只能使用一次。重設完成後，其他裝置上的登入狀態會自動失效。\n\n若不是你提出這項申請，請直接忽略這封信；你的密碼不會因此變更。請勿將此連結轉傳給任何人。`,
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
