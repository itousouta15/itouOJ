"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    {
      href: "/",
      label: "首頁",
      isActive: pathname === "/",
    },
    {
      href: "/problems",
      label: "題目",
      isActive: pathname.startsWith("/problems"),
    },
    {
      href: "/courses",
      label: "課程",
      isActive: pathname.startsWith("/courses"),
    },
    {
      href: "/submissions",
      label: "提交紀錄",
      isActive: pathname.startsWith("/submissions"),
    },
    {
      href: "/ranking",
      label: "排行榜",
      isActive: pathname.startsWith("/ranking"),
    },
    ...(isAdmin
      ? [
          {
            href: "/admin/problems",
            label: "管理",
            isActive: pathname.startsWith("/admin"),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-1 items-center gap-1 overflow-x-auto">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`nav-link ${l.isActive ? "active" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
