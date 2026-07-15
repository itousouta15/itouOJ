import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { googleConfigured } from "@/lib/googleOAuth";
import { discordConfigured } from "@/lib/discordOAuth";

export const metadata: Metadata = { title: "註冊" };

export default function RegisterPage() {
  return (
    <AuthForm
      mode="register"
      googleEnabled={googleConfigured()}
      discordEnabled={discordConfigured()}
    />
  );
}
