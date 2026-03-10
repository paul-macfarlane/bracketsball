import { eq, and, count, inArray } from "drizzle-orm";

import { db, type DbClient } from "@/lib/db";
import {
  bracketEntry,
  bracketPick,
  user,
  team,
  tournamentGame,
} from "@/lib/db/schema";
import { calculateBracketScores, type PoolScoring } from "@/lib/scoring";

interface CreateBracketEntryData {
  poolId: string;
  userId: string;
  tournamentId: string;
  name: string;
}

export async function createBracketEntry(data: CreateBracketEntryData) {
  const [entry] = await db.insert(bracketEntry).values(data).returning();
  return entry;
}

export async function getBracketEntryById(
  entryId: string,
  client: DbClient = db,
) {
  const [entry] = await client
    .select()
    .from(bracketEntry)
    .where(eq(bracketEntry.id, entryId))
    .limit(1);
  return entry ?? null;
}

export async function getBracketEntriesByPoolAndUser(
  poolId: string,
  userId: string,
) {
  return db
    .select()
    .from(bracketEntry)
    .where(
      and(eq(bracketEntry.poolId, poolId), eq(bracketEntry.userId, userId)),
    )
    .orderBy(bracketEntry.createdAt);
}

export async function getBracketEntryCountForUser(
  poolId: string,
  userId: string,
) {
  const [result] = await db
    .select({ count: count() })
    .from(bracketEntry)
    .where(
      and(eq(bracketEntry.poolId, poolId), eq(bracketEntry.userId, userId)),
    );
  return result.count;
}

export async function getMaxBracketCountForPool(poolId: string) {
  const entries = await db
    .select({
      userId: bracketEntry.userId,
      count: count(),
    })
    .from(bracketEntry)
    .where(eq(bracketEntry.poolId, poolId))
    .groupBy(bracketEntry.userId);

  if (entries.length === 0) return 0;
  return Math.max(...entries.map((e) => e.count));
}

export async function getPicksForEntry(
  bracketEntryId: string,
  client: DbClient = db,
) {
  return client
    .select()
    .from(bracketPick)
    .where(eq(bracketPick.bracketEntryId, bracketEntryId));
}

export async function savePick(
  bracketEntryId: string,
  tournamentGameId: string,
  pickedTeamId: string,
  client: DbClient = db,
) {
  return client.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(bracketPick)
      .where(
        and(
          eq(bracketPick.bracketEntryId, bracketEntryId),
          eq(bracketPick.tournamentGameId, tournamentGameId),
        ),
      )
      .limit(1);

    if (existing) {
      const [updated] = await tx
        .update(bracketPick)
        .set({ pickedTeamId })
        .where(eq(bracketPick.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await tx
      .insert(bracketPick)
      .values({ bracketEntryId, tournamentGameId, pickedTeamId })
      .returning();
    return created;
  });
}

export async function deletePicksForGames(
  bracketEntryId: string,
  gameIds: string[],
  client: DbClient = db,
) {
  if (gameIds.length === 0) return;

  await client
    .delete(bracketPick)
    .where(
      and(
        eq(bracketPick.bracketEntryId, bracketEntryId),
        inArray(bracketPick.tournamentGameId, gameIds),
      ),
    );
}

export async function updateTiebreaker(
  bracketEntryId: string,
  tiebreakerScore: number,
  client: DbClient = db,
) {
  const [updated] = await client
    .update(bracketEntry)
    .set({ tiebreakerScore })
    .where(eq(bracketEntry.id, bracketEntryId))
    .returning();
  return updated;
}

export async function updateBracketEntryName(
  bracketEntryId: string,
  name: string,
) {
  const [updated] = await db
    .update(bracketEntry)
    .set({ name })
    .where(eq(bracketEntry.id, bracketEntryId))
    .returning();
  return updated;
}

export async function submitBracketEntry(bracketEntryId: string) {
  const [updated] = await db
    .update(bracketEntry)
    .set({ status: "submitted" })
    .where(eq(bracketEntry.id, bracketEntryId))
    .returning();
  return updated;
}

export async function unsubmitBracketEntry(
  bracketEntryId: string,
  client: DbClient = db,
) {
  const [updated] = await client
    .update(bracketEntry)
    .set({ status: "draft" })
    .where(eq(bracketEntry.id, bracketEntryId))
    .returning();
  return updated;
}

export async function deleteBracketEntry(bracketEntryId: string) {
  await db.delete(bracketEntry).where(eq(bracketEntry.id, bracketEntryId));
}

export async function savePicksBatch(
  bracketEntryId: string,
  picks: { tournamentGameId: string; pickedTeamId: string }[],
  client: DbClient = db,
) {
  if (picks.length === 0) return;

  const doWork = async (tx: DbClient) => {
    for (const pick of picks) {
      const [existing] = await tx
        .select()
        .from(bracketPick)
        .where(
          and(
            eq(bracketPick.bracketEntryId, bracketEntryId),
            eq(bracketPick.tournamentGameId, pick.tournamentGameId),
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(bracketPick)
          .set({ pickedTeamId: pick.pickedTeamId })
          .where(eq(bracketPick.id, existing.id));
      } else {
        await tx.insert(bracketPick).values({
          bracketEntryId,
          tournamentGameId: pick.tournamentGameId,
          pickedTeamId: pick.pickedTeamId,
        });
      }
    }
  };

  // If caller already provided a transaction client, use it directly.
  // Otherwise wrap in our own transaction for atomicity.
  if (client === db) {
    await db.transaction(async (tx) => doWork(tx));
  } else {
    await doWork(client);
  }
}

export async function clearAllPicks(
  bracketEntryId: string,
  client: DbClient = db,
) {
  await client
    .delete(bracketPick)
    .where(eq(bracketPick.bracketEntryId, bracketEntryId));
}

export async function getPoolStandings(
  poolId: string,
  tournamentId: string,
  poolScoring: PoolScoring,
) {
  // Get bracket entries: all submitted + current user's drafts
  const entries = await db
    .select({
      id: bracketEntry.id,
      name: bracketEntry.name,
      status: bracketEntry.status,
      tiebreakerScore: bracketEntry.tiebreakerScore,
      userId: bracketEntry.userId,
      userName: user.name,
      userImage: user.image,
      userUsername: user.username,
    })
    .from(bracketEntry)
    .innerJoin(user, eq(bracketEntry.userId, user.id))
    .where(
      and(
        eq(bracketEntry.poolId, poolId),
        eq(bracketEntry.tournamentId, tournamentId),
        eq(bracketEntry.status, "submitted"),
      ),
    );

  if (entries.length === 0) return [];

  // Fetch all games and picks to compute live scores
  const games = await db
    .select({
      id: tournamentGame.id,
      round: tournamentGame.round,
      winnerTeamId: tournamentGame.winnerTeamId,
      status: tournamentGame.status,
      team1Id: tournamentGame.team1Id,
      team2Id: tournamentGame.team2Id,
      team1Score: tournamentGame.team1Score,
      team2Score: tournamentGame.team2Score,
    })
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));

  const entryIds = entries.map((e) => e.id);
  const allPicks = await db
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

  // Find championship game for champion picks and tiebreaker
  const championshipGame = games.find((g) => g.round === "championship");

  // Get championship picks with team info
  let championPicks: {
    bracketEntryId: string;
    pickedTeamId: string;
    teamName: string;
    teamShortName: string;
    teamLogoUrl: string | null;
  }[] = [];
  if (championshipGame) {
    const champPickRows = allPicks.filter(
      (p) => p.tournamentGameId === championshipGame.id,
    );
    const champTeamIds = [...new Set(champPickRows.map((p) => p.pickedTeamId))];
    if (champTeamIds.length > 0) {
      const teams = await db
        .select({
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          logoUrl: team.logoUrl,
        })
        .from(team)
        .where(inArray(team.id, champTeamIds));
      const teamMap = new Map(teams.map((t) => [t.id, t]));
      championPicks = champPickRows
        .map((p) => {
          const t = teamMap.get(p.pickedTeamId);
          if (!t) return null;
          return {
            bracketEntryId: p.bracketEntryId,
            pickedTeamId: p.pickedTeamId,
            teamName: t.name,
            teamShortName: t.shortName,
            teamLogoUrl: t.logoUrl,
          };
        })
        .filter(
          (
            p,
          ): p is {
            bracketEntryId: string;
            pickedTeamId: string;
            teamName: string;
            teamShortName: string;
            teamLogoUrl: string | null;
          } => p !== null,
        );
    }
  }

  const championPickMap = new Map(
    championPicks.map((cp) => [cp.bracketEntryId, cp]),
  );

  // Calculate actual championship total score if game is final
  const actualChampionshipTotal =
    championshipGame?.status === "final" &&
    championshipGame.team1Score !== null &&
    championshipGame.team2Score !== null
      ? championshipGame.team1Score + championshipGame.team2Score
      : null;

  // Compute live scores for each entry
  const entriesWithScores = entries.map((entry) => {
    const entryPicks = picksByEntry.get(entry.id) ?? [];
    const { totalPoints, potentialPoints } = calculateBracketScores(
      games,
      entryPicks,
      poolScoring,
    );
    return {
      ...entry,
      totalPoints,
      potentialPoints,
      championPick: championPickMap.get(entry.id) ?? null,
      tiebreakerDiff:
        actualChampionshipTotal !== null && entry.tiebreakerScore !== null
          ? Math.abs(entry.tiebreakerScore - actualChampionshipTotal)
          : null,
    };
  });

  // Sort: points desc, potential desc, tiebreaker accuracy asc, name asc
  entriesWithScores.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.potentialPoints !== a.potentialPoints)
      return b.potentialPoints - a.potentialPoints;
    if (a.tiebreakerDiff !== null && b.tiebreakerDiff !== null) {
      if (a.tiebreakerDiff !== b.tiebreakerDiff)
        return a.tiebreakerDiff - b.tiebreakerDiff;
    }
    return a.name.localeCompare(b.name);
  });

  // Assign ranks with ties
  const ranked: ((typeof entriesWithScores)[number] & { rank: number })[] = [];
  for (let i = 0; i < entriesWithScores.length; i++) {
    const entry = entriesWithScores[i];
    let rank = i + 1;
    if (i > 0) {
      const prev = entriesWithScores[i - 1];
      if (
        entry.totalPoints === prev.totalPoints &&
        entry.potentialPoints === prev.potentialPoints &&
        entry.tiebreakerDiff === prev.tiebreakerDiff
      ) {
        rank = ranked[i - 1].rank;
      }
    }
    ranked.push({ ...entry, rank });
  }

  return ranked;
}

export async function deleteBracketEntriesForMember(
  poolId: string,
  userId: string,
) {
  await db
    .delete(bracketEntry)
    .where(
      and(eq(bracketEntry.poolId, poolId), eq(bracketEntry.userId, userId)),
    );
}
