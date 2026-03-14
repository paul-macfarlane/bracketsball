import { headers } from "next/headers";
import Link from "next/link";

import { auth, type Session } from "@/lib/auth";
import { AppHeader } from "@/app/(app)/app-header";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { getPendingInviteCountForUser } from "@/lib/db/queries/pool-user-invites";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const pendingInviteCount = session
    ? await getPendingInviteCountForUser(session.user.id)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      {session ? (
        <AppHeader
          session={session as Session}
          pendingInviteCount={pendingInviteCount}
        />
      ) : (
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container mx-auto flex h-14 items-center justify-between px-4">
            <Link
              href="/"
              className="font-heading text-lg font-bold uppercase tracking-wide"
            >
              Bracketsball
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </header>
      )}
      <main className="container mx-auto flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
