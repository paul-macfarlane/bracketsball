import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPublicPools, hasTournamentStarted } from "@/lib/db/queries/pools";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { StickySubHeader } from "@/components/sticky-sub-header";
import { DiscoverPoolsClient } from "./discover-pools-client";

export default async function DiscoverPoolsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const [initialData, tournamentStarted] = await Promise.all([
    getPublicPools({ userId: session.user.id }),
    hasTournamentStarted(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <StickySubHeader>
        <PageBreadcrumbs
          crumbs={[{ label: "Pools", href: "/pools" }, { label: "Discover" }]}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold">Discover Pools</h1>
      </StickySubHeader>

      <DiscoverPoolsClient
        initialData={initialData}
        tournamentStarted={tournamentStarted}
      />
    </div>
  );
}
