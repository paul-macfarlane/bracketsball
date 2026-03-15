import { eq, inArray } from "drizzle-orm";

import { db, type DbClient } from "@/lib/db";
import {
  bracketEntry,
  bracketPick,
  pool,
  tournamentGame,
} from "@/lib/db/schema";
import { calculateBracketScores, type PoolScoring } from "@/lib/scoring";

export async function syncStandingsForTournament(
  tournamentId: string,
  client: DbClient = db,
) {
  // Get all pools (every pool uses the active tournament)
  const pools = await client.select().from(pool);

  // Get all games for this tournament
  const games = await client
    .select({
      id: tournamentGame.id,
      round: tournamentGame.round,
      winnerTeamId: tournamentGame.winnerTeamId,
      status: tournamentGame.status,
      team1Id: tournamentGame.team1Id,
      team2Id: tournamentGame.team2Id,
    })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));

  // Get all bracket entries for this tournament
  const entries = await client
    .select()
    .from(bracketEntry)
    .where(eq(bracketEntry.tournamentId, tournamentId));

  if (entries.length === 0) return { updatedCount: 0 };

  // Get picks only for this tournament's entries (not all picks globally)
  const entryIds = entries.map((e) => e.id);
  const allPicks = await client
    .select({
      bracketEntryId: bracketPick.bracketEntryId,
      tournamentGameId: bracketPick.tournamentGameId,
      pickedTeamId: bracketPick.pickedTeamId,
    })
    .from(bracketPick)
    .where(inArray(bracketPick.bracketEntryId, entryIds));

  // Group picks by entry
  const picksByEntry = new Map<
    string,
    { tournamentGameId: string; pickedTeamId: string }[]
  >();
  for (const pick of allPicks) {
    const list = picksByEntry.get(pick.bracketEntryId) ?? [];
    list.push({
      tournamentGameId: pick.tournamentGameId,
      pickedTeamId: pick.pickedTeamId,
    });
    picksByEntry.set(pick.bracketEntryId, list);
  }

  // Build pool scoring lookup
  const poolScoringMap = new Map<string, PoolScoring>();
  for (const p of pools) {
    poolScoringMap.set(p.id, {
      scoringFirstFour: p.scoringFirstFour,
      scoringRound64: p.scoringRound64,
      scoringRound32: p.scoringRound32,
      scoringSweet16: p.scoringSweet16,
      scoringElite8: p.scoringElite8,
      scoringFinalFour: p.scoringFinalFour,
      scoringChampionship: p.scoringChampionship,
    });
  }

  // Calculate and update scores for each entry
  let updatedCount = 0;

  const doWork = async (tx: DbClient) => {
    for (const entry of entries) {
      const entryPicks = picksByEntry.get(entry.id) ?? [];
      const poolScoring = poolScoringMap.get(entry.poolId);
      if (!poolScoring) continue;

      const { totalPoints, potentialPoints } = calculateBracketScores(
        games,
        entryPicks,
        poolScoring,
      );

      await tx
        .update(bracketEntry)
        .set({ totalPoints, potentialPoints })
        .where(eq(bracketEntry.id, entry.id));

      updatedCount++;
    }
  };

  if (client === db) {
    await db.transaction(doWork);
  } else {
    await doWork(client);
  }

  return { updatedCount };
}
