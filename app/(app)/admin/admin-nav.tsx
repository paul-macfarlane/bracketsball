"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { StickySubHeader } from "@/components/sticky-sub-header";

const adminLinks = [
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/tournaments", label: "Tournaments" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <StickySubHeader className="py-4">
      <nav className="flex items-center gap-4">
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
    </StickySubHeader>
  );
}
