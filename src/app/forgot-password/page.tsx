import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = { title: "忘記密碼" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="card p-6">
        <h1 className="mb-4 text-xl font-bold">忘記密碼</h1>
        <ForgotPasswordForm />
        <p className="mt-4 text-center text-sm text-dim">
          想起密碼了？ <Link href="/login" className="text-blue hover:underline">登入</Link>
        </p>
      </div>
    </div>
  );
}
