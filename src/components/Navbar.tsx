import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import AccountMenu from "@/components/AccountMenu";

export default async function Navbar() {
  const session = await getSession();
  const displayName = session
    ? (
        await prisma.user.findUnique({
          where: { id: session.userId },
          select: { displayName: true },
        })
      )?.displayName
    : null;

  return (
    <header className="site-header">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="logo">
          itouOJ (๑•̀ω•́๑)
        </Link>
        <NavLinks isAdmin={session?.role === "ADMIN"} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <AccountMenu name={displayName || session.username} />
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
