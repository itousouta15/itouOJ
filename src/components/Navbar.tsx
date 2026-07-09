import Link from "next/link";
import { getSession } from "@/lib/auth";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import LogoutButton from "@/components/LogoutButton";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header className="site-header">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="logo">
          Online Judge
        </Link>
        <NavLinks isAdmin={session?.role === "ADMIN"} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <span className="mono text-sm font-medium text-tx">
                {session.username}
              </span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                登入
              </Link>
              <Link href="/register" className="btn-primary">
                註冊
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
