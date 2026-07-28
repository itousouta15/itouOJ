import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { googleConfigured } from "@/lib/googleOAuth";
import { discordConfigured } from "@/lib/discordOAuth";
import { safeNextPath } from "@/lib/safeNext";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <AuthForm
      mode="login"
      googleEnabled={googleConfigured()}
      googleError={error === "google"}
      discordEnabled={discordConfigured()}
      discordError={error === "discord"}
      next={safeNextPath(next)}
    />
  );
}
