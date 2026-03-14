import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "@/lib/auth";
import { AppHeader } from "./app-header";
import { SiteFooter } from "@/components/site-footer";
import { getPendingInviteCountForUser } from "@/lib/db/queries/pool-user-invites";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const pendingInviteCount = await getPendingInviteCountForUser(
    session.user.id,
  );

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        session={session as Session}
        pendingInviteCount={pendingInviteCount}
      />
      <main className="container mx-auto flex-1 px-4 py-6">{children}</main>
      <SiteFooter />
    </div>
  );
}
