import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import { getPoolInvitesByPoolId } from "@/lib/db/queries/pool-invites";
import { getPoolMembers } from "@/lib/db/queries/pool-members";
import {
  getBracketEntriesByPoolAndUser,
  getBracketEntryCountForUser,
  getPoolStandings,
} from "@/lib/db/queries/bracket-entries";
import { getActiveTournament } from "@/lib/db/queries/tournaments";
import { hasTournamentStarted } from "@/lib/db/queries/pools";
import {
  canAccessPoolPage,
  canPerformPoolAction,
} from "@/lib/permissions/pools";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InviteList } from "./invites/invite-list";
import { MemberList } from "./members/member-list";
import { CreateBracketDialog } from "./brackets/create-bracket-dialog";
import { StandingsTable } from "@/components/pool/standings-table";
import type { PoolScoring } from "@/lib/scoring";

export default async function PoolDetailPage({
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

  const isLeader = canPerformPoolAction(
    poolData.membership.role,
    "create-invite",
  );
  const invites = isLeader ? await getPoolInvitesByPoolId(id) : [];
  const members = await getPoolMembers(id);
  const remainingCapacity =
    poolData.pool.maxParticipants - poolData.memberCount;

  const [activeTournament, tournamentStarted] = await Promise.all([
    getActiveTournament(),
    hasTournamentStarted(),
  ]);
  const bracketEntries = activeTournament
    ? await getBracketEntriesByPoolAndUser(id, session.user.id)
    : [];
  const bracketCount = activeTournament
    ? await getBracketEntryCountForUser(id, session.user.id)
    : 0;
  const canCreateBracket =
    !!activeTournament &&
    !tournamentStarted &&
    bracketCount < poolData.pool.maxBracketsPerUser;

  const poolScoring: PoolScoring = {
    scoringFirstFour: poolData.pool.scoringFirstFour,
    scoringRound64: poolData.pool.scoringRound64,
    scoringRound32: poolData.pool.scoringRound32,
    scoringSweet16: poolData.pool.scoringSweet16,
    scoringElite8: poolData.pool.scoringElite8,
    scoringFinalFour: poolData.pool.scoringFinalFour,
    scoringChampionship: poolData.pool.scoringChampionship,
  };

  const standings = activeTournament
    ? await getPoolStandings(
        id,
        activeTournament.id,
        session.user.id,
        poolScoring,
      )
    : [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <Link
          href="/pools"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to pools
        </Link>
      </div>

      <div className="mb-4 flex items-start justify-between">
        <h1 className="text-2xl font-bold">{poolData.pool.name}</h1>
        <div className="flex gap-2">
          {canAccessPoolPage(poolData.membership.role, "settings") && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/pools/${id}/settings`}>Settings</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Standings — front and center */}
      {activeTournament && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Standings</CardTitle>
            <CardDescription>
              {standings.length} bracket{standings.length !== 1 ? "s" : ""} in
              this pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StandingsTable standings={standings} poolId={id} />
          </CardContent>
        </Card>
      )}

      {/* My Brackets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>My Brackets</CardTitle>
            {activeTournament && !tournamentStarted && (
              <CreateBracketDialog
                poolId={id}
                canCreate={canCreateBracket}
                maxBrackets={poolData.pool.maxBracketsPerUser}
                currentCount={bracketCount}
              />
            )}
          </div>
          {!activeTournament && (
            <CardDescription>
              No active tournament. Brackets can be created once a tournament is
              active.
            </CardDescription>
          )}
        </CardHeader>
        {bracketEntries.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {bracketEntries.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/pools/${id}/brackets/${entry.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
                >
                  <span className="font-medium">{entry.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.status === "submitted" ? "default" : "secondary"
                      }
                    >
                      {entry.status === "submitted" ? "Submitted" : "Draft"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="mt-6">
        <MemberList
          poolId={id}
          members={members}
          currentUserId={session.user.id}
          isLeader={isLeader}
          currentMembershipId={poolData.membership.id}
        />
      </div>
      {isLeader && !tournamentStarted && (
        <div className="mt-6">
          <InviteList
            poolId={id}
            invites={invites}
            remainingCapacity={remainingCapacity}
          />
        </div>
      )}
    </div>
  );
}
