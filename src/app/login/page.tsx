import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { googleConfigured } from "@/lib/googleOAuth";

export const metadata: Metadata = { title: "登入" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      googleEnabled={googleConfigured()}
      googleError={error === "google"}
    />
  );
}
