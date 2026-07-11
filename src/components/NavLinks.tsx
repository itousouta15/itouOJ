"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinksFor, isNavActive } from "@/lib/navLinks";

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = navLinksFor(isAdmin);

  return (
    <div className="flex flex-1 items-center gap-1 overflow-x-auto">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link ${isNavActive(pathname, l.href) ? "active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
