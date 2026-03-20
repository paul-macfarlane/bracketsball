import { and, eq, inArray } from "drizzle-orm";

import { db, type DbClient } from "@/lib/db";
import {
  bracketEntry,
  bracketPick,
  pool,
  standingsSnapshot,
  tournamentGame,
} from "@/lib/db/schema";
import {
  calculateBracketScores,
  sortAndRankStandings,
  type PoolScoring,
} from "@/lib/scoring";

const ROUND_ORDER = [
  "first_four",
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
] as const;

type TournamentRound = (typeof ROUND_ORDER)[number];

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

/**
 * Snapshot standings for a specific completed round.
 * Scores are computed using only games from rounds <= the target round,
 * so backfill produces historically accurate snapshots.
 */
async function snapshotStandingsForRound(
  tournamentId: string,
  round: TournamentRound,
) {
  const roundIndex = ROUND_ORDER.indexOf(round);
  const roundsUpToTarget = ROUND_ORDER.slice(0, roundIndex + 1);

  const pools = await db.select().from(pool);

  const allGames = await db
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

  // Filter games to only rounds <= target for accurate historical scoring
  const gamesUpToRound = allGames.filter((g) =>
    roundsUpToTarget.includes(g.round as TournamentRound),
  );

  const entries = await db
    .select()
    .from(bracketEntry)
    .where(
      and(
        eq(bracketEntry.tournamentId, tournamentId),
        eq(bracketEntry.status, "submitted"),
      ),
    );

  if (entries.length === 0) return;

  const entryIds = entries.map((e) => e.id);
  const allPicks = await db
    .select({
      bracketEntryId: bracketPick.bracketEntryId,
      tournamentGameId: bracketPick.tournamentGameId,
      pickedTeamId: bracketPick.pickedTeamId,
    })
    .from(bracketPick)
    .where(inArray(bracketPick.bracketEntryId, entryIds));

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

  // Group entries by pool and compute ranked standings per pool
  const entriesByPool = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = entriesByPool.get(entry.poolId) ?? [];
    list.push(entry);
    entriesByPool.set(entry.poolId, list);
  }

  await db.transaction(async (tx) => {
    for (const [poolId, poolEntries] of entriesByPool) {
      const scoring = poolScoringMap.get(poolId);
      if (!scoring) continue;

      const entriesWithScores = poolEntries.map((entry) => {
        const entryPicks = picksByEntry.get(entry.id) ?? [];
        const { totalPoints, potentialPoints } = calculateBracketScores(
          gamesUpToRound,
          entryPicks,
          scoring,
        );
        return {
          id: entry.id,
          name: entry.name,
          totalPoints,
          potentialPoints,
          tiebreakerDiff: null as number | null,
        };
      });

      const ranked = sortAndRankStandings(entriesWithScores);

      for (const entry of ranked) {
        await tx
          .insert(standingsSnapshot)
          .values({
            bracketEntryId: entry.id,
            poolId,
            tournamentId,
            round,
            rank: entry.rank,
            totalPoints: entry.totalPoints,
            potentialPoints: entry.potentialPoints,
          })
          .onConflictDoUpdate({
            target: [standingsSnapshot.bracketEntryId, standingsSnapshot.round],
            set: {
              rank: entry.rank,
              totalPoints: entry.totalPoints,
              potentialPoints: entry.potentialPoints,
            },
          });
      }
    }
  });
}

/**
 * Detect completed rounds that don't have snapshots yet and create them.
 * Called after each ESPN sync. Idempotent.
 */
export async function detectAndSnapshotCompletedRounds(
  tournamentId: string,
): Promise<{ snapshotted: TournamentRound[] }> {
  const games = await db
    .select({
      round: tournamentGame.round,
      status: tournamentGame.status,
    })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));

  // Group games by round and check if all are final
  const gamesByRound = new Map<string, { total: number; final: number }>();
  for (const game of games) {
    const entry = gamesByRound.get(game.round) ?? { total: 0, final: 0 };
    entry.total++;
    if (game.status === "final") entry.final++;
    gamesByRound.set(game.round, entry);
  }

  // Find rounds that are fully complete
  const completedRounds: TournamentRound[] = [];
  for (const round of ROUND_ORDER) {
    const stats = gamesByRound.get(round);
    if (stats && stats.total > 0 && stats.final === stats.total) {
      completedRounds.push(round);
    }
  }

  if (completedRounds.length === 0) return { snapshotted: [] };

  // Check which completed rounds already have snapshots
  const existingSnapshots = await db
    .select({ round: standingsSnapshot.round })
    .from(standingsSnapshot)
    .where(
      and(
        eq(standingsSnapshot.tournamentId, tournamentId),
        inArray(standingsSnapshot.round, completedRounds),
      ),
    );

  const existingRounds = new Set(existingSnapshots.map((s) => s.round));
  const roundsToSnapshot = completedRounds.filter(
    (r) => !existingRounds.has(r),
  );

  for (const round of roundsToSnapshot) {
    await snapshotStandingsForRound(tournamentId, round);
  }

  return { snapshotted: roundsToSnapshot };
}

/**
 * Get movement data for standings display.
 * Returns a map from bracketEntryId to previous rank info.
 */
export async function getStandingsMovement(
  poolId: string,
  tournamentId: string,
): Promise<Map<string, { previousRank: number | null; isNew: boolean }>> {
  const result = new Map<
    string,
    { previousRank: number | null; isNew: boolean }
  >();

  // Find completed rounds by checking game statuses
  const games = await db
    .select({
      round: tournamentGame.round,
      status: tournamentGame.status,
    })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));

  const gamesByRound = new Map<string, { total: number; final: number }>();
  for (const game of games) {
    const entry = gamesByRound.get(game.round) ?? { total: 0, final: 0 };
    entry.total++;
    if (game.status === "final") entry.final++;
    gamesByRound.set(game.round, entry);
  }

  // Find the latest completed round
  let latestCompletedIndex = -1;
  for (let i = ROUND_ORDER.length - 1; i >= 0; i--) {
    const stats = gamesByRound.get(ROUND_ORDER[i]);
    if (stats && stats.total > 0 && stats.final === stats.total) {
      latestCompletedIndex = i;
      break;
    }
  }

  if (latestCompletedIndex < 0) return result;

  // Find the previous completed round (the one before the latest)
  let previousRoundIndex = -1;
  for (let i = latestCompletedIndex - 1; i >= 0; i--) {
    const stats = gamesByRound.get(ROUND_ORDER[i]);
    if (stats && stats.total > 0 && stats.final === stats.total) {
      previousRoundIndex = i;
      break;
    }
  }

  if (previousRoundIndex < 0) return result;

  const previousRound = ROUND_ORDER[previousRoundIndex];

  // Get previous round's snapshot for this pool
  const snapshots = await db
    .select({
      bracketEntryId: standingsSnapshot.bracketEntryId,
      rank: standingsSnapshot.rank,
    })
    .from(standingsSnapshot)
    .where(
      and(
        eq(standingsSnapshot.poolId, poolId),
        eq(standingsSnapshot.tournamentId, tournamentId),
        eq(standingsSnapshot.round, previousRound),
      ),
    );

  const previousRankMap = new Map(
    snapshots.map((s) => [s.bracketEntryId, s.rank]),
  );

  // Get current submitted entries to determine NEW vs. existing
  const entries = await db
    .select({ id: bracketEntry.id })
    .from(bracketEntry)
    .where(
      and(
        eq(bracketEntry.poolId, poolId),
        eq(bracketEntry.tournamentId, tournamentId),
        eq(bracketEntry.status, "submitted"),
      ),
    );

  for (const entry of entries) {
    const prevRank = previousRankMap.get(entry.id);
    if (prevRank != null) {
      result.set(entry.id, { previousRank: prevRank, isNew: false });
    } else {
      result.set(entry.id, { previousRank: null, isNew: true });
    }
  }

  return result;
}
