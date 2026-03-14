import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPendingInvitesForUser } from "@/lib/db/queries/pool-user-invites";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { StickySubHeader } from "@/components/sticky-sub-header";
import { InviteResponseList } from "./invite-response-list";

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  const invites = await getPendingInvitesForUser(session.user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <StickySubHeader>
        <PageBreadcrumbs
          crumbs={[{ label: "Notifications" }]}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </StickySubHeader>

      <Card>
        <CardHeader>
          <CardTitle>Pool Invites</CardTitle>
          <CardDescription>
            {invites.length} pending invite{invites.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending invites. When someone invites you to a pool, it will
              appear here.
            </p>
          ) : (
            <InviteResponseList invites={invites} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
