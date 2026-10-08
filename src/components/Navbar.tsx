import Link from "next/link";
import { getNavInfo } from "@/lib/nav";
import NavLinks from "@/components/NavLinks";
import AccountMenu from "@/components/AccountMenu";
import HeaderSearch from "@/components/HeaderSearch";
import MobileMenuButton from "@/components/MobileMenuButton";

export default async function Navbar() {
  const { displayName, username, unread, loggedIn, isAdmin } = await getNavInfo();

  return (
    <header className="site-header">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="header-brand" aria-label="itouOJ 首頁">
          <span className="logo header-wordmark">itouOJ</span>
        </Link>
        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <NavLinks />
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:ml-0">
          <HeaderSearch />
          {loggedIn ? (
            <AccountMenu
              name={displayName || username || ""}
              username={username ?? ""}
              unread={unread}
              isAdmin={isAdmin}
            />
          ) : (
            <>
              <Link href="/login" className="nav-link">
                登入
              </Link>
              <Link href="/register" className="btn-primary hidden sm:inline-flex">
                註冊
              </Link>
            </>
          )}
          <MobileMenuButton isAdmin={isAdmin} username={loggedIn ? username : null} />
        </div>
      </nav>
    </header>
  );
}
