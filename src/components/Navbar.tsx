import Link from "next/link";
import { getNavInfo } from "@/lib/nav";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import AccountMenu from "@/components/AccountMenu";
import HeaderSearch from "@/components/HeaderSearch";
import MobileMenuButton from "@/components/MobileMenuButton";

export default async function Navbar() {
  const { displayName, username, unread, loggedIn, isAdmin } = await getNavInfo();

  return (
    <header className="site-header">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="logo">
          itouOJ
        </Link>
        <div className="hidden min-w-0 flex-1 md:flex">
          <NavLinks isAdmin={isAdmin} />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
          <ThemeToggle />
          <HeaderSearch />
          {loggedIn ? (
            <AccountMenu
              name={displayName || username || ""}
              username={username ?? ""}
              unread={unread}
            />
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
          <MobileMenuButton isAdmin={isAdmin} />
        </div>
      </nav>
    </header>
  );
}
