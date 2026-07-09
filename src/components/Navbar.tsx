import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="bg-zinc-900 text-zinc-100">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          ⚖️ Online Judge
        </Link>
        <div className="flex flex-1 items-center gap-5 text-sm text-zinc-300">
          <Link href="/" className="hover:text-white">
            題目
          </Link>
          <Link href="/submissions" className="hover:text-white">
            提交紀錄
          </Link>
          <Link href="/ranking" className="hover:text-white">
            排行榜
          </Link>
          {session?.role === "ADMIN" && (
            <Link href="/admin/problems" className="hover:text-white">
              管理
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <span className="font-medium text-white">
                {session.username}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-zinc-300 hover:text-white">
                登入
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
              >
                註冊
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
