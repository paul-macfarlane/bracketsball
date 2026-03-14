import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { StickySubHeader } from "@/components/sticky-sub-header";
import {
  getPoolById,
  getMaxBracketCountInPool,
  hasTournamentStarted,
} from "@/lib/db/queries/pools";
import { getActiveTournament } from "@/lib/db/queries/tournaments";
import { canAccessPoolPage } from "@/lib/permissions/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PoolSettingsForm } from "./pool-settings-form";
import { DeletePoolForm } from "./delete-pool-form";

export default async function PoolSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  const poolData = await getPoolById(id, session.user.id);

  if (!poolData) {
    notFound();
  }

  if (!canAccessPoolPage(poolData.membership.role, "settings")) {
    notFound();
  }

  const [tournamentStarted, activeTournament] = await Promise.all([
    hasTournamentStarted(),
    getActiveTournament(),
  ]);
  const maxBracketCountInPool = activeTournament
    ? await getMaxBracketCountInPool(id, activeTournament.id)
    : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <StickySubHeader>
        <PageBreadcrumbs
          crumbs={[
            { label: "Pools", href: "/pools" },
            { label: poolData.pool.name, href: `/pools/${id}` },
            { label: "Settings" },
          ]}
          className="mb-2"
        />
        <h1 className="text-2xl font-bold">{poolData.pool.name} Settings</h1>
      </StickySubHeader>

      <Card>
        <CardHeader>
          <CardTitle>Pool Settings</CardTitle>
          <CardDescription>
            {tournamentStarted
              ? "Settings are locked because the tournament has started."
              : "Update your pool settings. Changes are allowed until the tournament begins."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentStarted ? (
            <p className="text-sm text-muted-foreground">
              Pool settings cannot be modified after the tournament has started.
            </p>
          ) : (
            <PoolSettingsForm
              poolId={id}
              defaultValues={{
                name: poolData.pool.name,
                visibility: poolData.pool.visibility,
                imageUrl: poolData.pool.imageUrl ?? "",
                maxBracketsPerUser: poolData.pool.maxBracketsPerUser,
                maxParticipants: poolData.pool.maxParticipants,
                scoringFirstFour: poolData.pool.scoringFirstFour,
                scoringRound64: poolData.pool.scoringRound64,
                scoringRound32: poolData.pool.scoringRound32,
                scoringSweet16: poolData.pool.scoringSweet16,
                scoringElite8: poolData.pool.scoringElite8,
                scoringFinalFour: poolData.pool.scoringFinalFour,
                scoringChampionship: poolData.pool.scoringChampionship,
              }}
              memberCount={poolData.memberCount}
              maxBracketCountInPool={maxBracketCountInPool}
            />
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <DeletePoolForm poolId={id} poolName={poolData.pool.name} />
      </div>
    </div>
  );
}
