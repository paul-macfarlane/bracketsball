import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link
            href="/"
            className="font-heading text-lg font-bold uppercase tracking-wide"
          >
            Bracketsball
          </Link>
        </div>
      </header>
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
