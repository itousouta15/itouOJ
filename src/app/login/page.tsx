import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "登入" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
