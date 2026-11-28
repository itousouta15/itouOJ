import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = { title: "重設密碼" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const validToken = token && /^[a-f0-9]{64}$/.test(token);
  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="card p-6">
        <h1 className="mb-4 text-xl font-bold">重設密碼</h1>
        {validToken ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-[#ff6b6b]">
            重設連結無效或已過期。請 <Link href="/forgot-password" className="text-blue hover:underline">重新申請</Link>。
          </p>
        )}
      </div>
    </div>
  );
}
