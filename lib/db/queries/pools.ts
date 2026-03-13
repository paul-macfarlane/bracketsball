import { eq, and, count, or, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolMember, tournament, tournamentGame } from "@/lib/db/schema";

interface CreatePoolData {
  name: string;
  imageUrl?: string | null;
  maxBracketsPerUser: number;
  maxParticipants: number;
}

export async function createPoolWithLeader(
  data: CreatePoolData,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [newPool] = await tx
      .insert(pool)
      .values({
        name: data.name,
        imageUrl: data.imageUrl || null,
        maxBracketsPerUser: data.maxBracketsPerUser,
        maxParticipants: data.maxParticipants,
      })
      .returning();

    await tx.insert(poolMember).values({
      poolId: newPool.id,
      userId,
      role: "leader",
    });

    return newPool;
  });
}

export async function getPoolsByUserId(userId: string) {
  return db
    .select({
      id: pool.id,
      name: pool.name,
      imageUrl: pool.imageUrl,
      maxBracketsPerUser: pool.maxBracketsPerUser,
      maxParticipants: pool.maxParticipants,
      role: poolMember.role,
      joinedAt: poolMember.joinedAt,
    })
    .from(poolMember)
    .innerJoin(pool, eq(poolMember.poolId, pool.id))
    .where(eq(poolMember.userId, userId));
}

export async function getPoolById(poolId: string, userId: string) {
  const [membership] = await db
    .select()
    .from(poolMember)
    .where(and(eq(poolMember.poolId, poolId), eq(poolMember.userId, userId)))
    .limit(1);

  if (!membership) {
    return null;
  }

  const [poolData] = await db
    .select()
    .from(pool)
    .where(eq(pool.id, poolId))
    .limit(1);

  if (!poolData) {
    return null;
  }

  const [memberCountResult] = await db
    .select({ count: count() })
    .from(poolMember)
    .where(eq(poolMember.poolId, poolId));

  return {
    pool: poolData,
    membership,
    memberCount: memberCountResult.count,
  };
}

interface UpdatePoolData {
  name: string;
  imageUrl?: string | null;
  maxBracketsPerUser: number;
  maxParticipants: number;
  scoringFirstFour: number;
  scoringRound64: number;
  scoringRound32: number;
  scoringSweet16: number;
  scoringElite8: number;
  scoringFinalFour: number;
  scoringChampionship: number;
}

export async function updatePool(poolId: string, data: UpdatePoolData) {
  const [updated] = await db
    .update(pool)
    .set({
      name: data.name,
      imageUrl: data.imageUrl || null,
      maxBracketsPerUser: data.maxBracketsPerUser,
      maxParticipants: data.maxParticipants,
      scoringFirstFour: data.scoringFirstFour,
      scoringRound64: data.scoringRound64,
      scoringRound32: data.scoringRound32,
      scoringSweet16: data.scoringSweet16,
      scoringElite8: data.scoringElite8,
      scoringFinalFour: data.scoringFinalFour,
      scoringChampionship: data.scoringChampionship,
    })
    .where(eq(pool.id, poolId))
    .returning();

  return updated;
}

export async function getPoolMemberCount(poolId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(poolMember)
    .where(eq(poolMember.poolId, poolId));

  return result.count;
}

export async function deletePool(poolId: string) {
  await db.delete(pool).where(eq(pool.id, poolId));
}

export async function getMaxBracketCountInPool(
  poolId: string,
): Promise<number> {
  const { getMaxBracketCountForPool } = await import("./bracket-entries");
  return getMaxBracketCountForPool(poolId);
}

export async function hasTournamentStarted(): Promise<boolean> {
  const [activeTournament] = await db
    .select({ id: tournament.id })
    .from(tournament)
    .where(eq(tournament.isActive, true))
    .limit(1);

  if (!activeTournament) return false;

  const [startedGame] = await db
    .select({ id: tournamentGame.id })
    .from(tournamentGame)
    .where(
      and(
        eq(tournamentGame.tournamentId, activeTournament.id),
        or(ne(tournamentGame.status, "scheduled")),
      ),
    )
    .limit(1);

  return !!startedGame;
}
