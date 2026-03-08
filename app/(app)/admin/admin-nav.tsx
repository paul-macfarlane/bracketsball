"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/tournaments", label: "Tournaments" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex items-center gap-4 border-b pb-4">
      {adminLinks.map((link) => {
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm hover:text-primary ${isActive ? "font-medium text-primary" : "text-muted-foreground"}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
