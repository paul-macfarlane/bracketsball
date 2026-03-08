import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { getPoolById } from "@/lib/db/queries/pools";
import { getBracketEntryById } from "@/lib/db/queries/bracket-entries";
import { getPicksForEntry } from "@/lib/db/queries/bracket-entries";
import {
  getTournamentById,
  getTournamentGames,
  getTournamentTeams,
} from "@/lib/db/queries/tournaments";
import { hasTournamentStarted } from "@/lib/db/queries/pools";
import { BracketEditor } from "@/components/bracket/bracket-editor";
import type { BracketTeam } from "@/components/bracket/types";
import type { PoolScoring } from "@/lib/scoring";

export default async function BracketEditorPage({
  params,
}: {
  params: Promise<{ id: string; bracketId: string }>;
}) {
  const { id: poolId, bracketId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    notFound();
  }

  const poolData = await getPoolById(poolId, session.user.id);
  if (!poolData) {
    notFound();
  }

  const entry = await getBracketEntryById(bracketId);
  if (!entry || entry.userId !== session.user.id || entry.poolId !== poolId) {
    notFound();
  }

  const [tournamentData, games, tournamentTeamsRaw, picks, tournamentStarted] =
    await Promise.all([
      getTournamentById(entry.tournamentId),
      getTournamentGames(entry.tournamentId),
      getTournamentTeams(entry.tournamentId),
      getPicksForEntry(bracketId),
      hasTournamentStarted(),
    ]);

  // Map tournament teams to the shape our bracket components expect
  const tournamentTeams: BracketTeam[] = tournamentTeamsRaw.map((tt) => ({
    id: tt.teamId,
    name: tt.teamName,
    shortName: tt.teamShortName,
    abbreviation: tt.teamAbbreviation,
    logoUrl: tt.teamLogoUrl,
    seed: tt.seed,
    region: tt.region,
  }));

  const bracketPicks = picks.map((p) => ({
    tournamentGameId: p.tournamentGameId,
    pickedTeamId: p.pickedTeamId,
  }));

  const bracketPositions =
    tournamentData?.bracketTopLeftRegion &&
    tournamentData?.bracketBottomLeftRegion &&
    tournamentData?.bracketTopRightRegion &&
    tournamentData?.bracketBottomRightRegion
      ? {
          topLeft: tournamentData.bracketTopLeftRegion,
          bottomLeft: tournamentData.bracketBottomLeftRegion,
          topRight: tournamentData.bracketTopRightRegion,
          bottomRight: tournamentData.bracketBottomRightRegion,
        }
      : undefined;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4">
        <Link
          href={`/pools/${poolId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to {poolData.pool.name}
        </Link>
      </div>

      <BracketEditor
        bracketEntryId={bracketId}
        bracketName={entry.name}
        bracketStatus={entry.status}
        tiebreakerScore={entry.tiebreakerScore}
        games={games}
        tournamentTeams={tournamentTeams}
        initialPicks={bracketPicks}
        poolId={poolId}
        bracketPositions={bracketPositions}
        tournamentStarted={tournamentStarted}
        poolScoring={
          {
            scoringFirstFour: poolData.pool.scoringFirstFour,
            scoringRound64: poolData.pool.scoringRound64,
            scoringRound32: poolData.pool.scoringRound32,
            scoringSweet16: poolData.pool.scoringSweet16,
            scoringElite8: poolData.pool.scoringElite8,
            scoringFinalFour: poolData.pool.scoringFinalFour,
            scoringChampionship: poolData.pool.scoringChampionship,
          } satisfies PoolScoring
        }
      />
    </div>
  );
}
