import { eq, and, count, ilike, desc, asc, sql, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolMember, tournament } from "@/lib/db/schema";
import type { PoolVisibility } from "@/lib/validators/pool";

interface CreatePoolData {
  name: string;
  visibility: PoolVisibility;
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
        visibility: data.visibility,
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
  visibility: PoolVisibility;
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
      visibility: data.visibility,
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
  const lockTime = await getBracketLockTime();
  if (!lockTime) return false;
  return new Date() >= lockTime;
}

export async function getBracketLockTime(): Promise<Date | null> {
  const [activeTournament] = await db
    .select({ bracketLockTime: tournament.bracketLockTime })
    .from(tournament)
    .where(eq(tournament.isActive, true))
    .limit(1);

  return activeTournament?.bracketLockTime ?? null;
}

export type PublicPoolSortOption =
  | "most-members"
  | "most-available"
  | "fewest-brackets"
  | "most-brackets"
  | "alphabetical";

interface GetPublicPoolsOptions {
  userId: string;
  search?: string;
  minBracketsPerUser?: number;
  maxBracketsPerUser?: number;
  minParticipants?: number;
  maxParticipants?: number;
  sort?: PublicPoolSortOption;
  page?: number;
  pageSize?: number;
}

export async function getPublicPools(options: GetPublicPoolsOptions) {
  const memberCountSubquery = db
    .select({
      poolId: poolMember.poolId,
      memberCount: count().as("member_count"),
    })
    .from(poolMember)
    .groupBy(poolMember.poolId)
    .as("member_counts");
  const {
    userId,
    search,
    minBracketsPerUser,
    maxBracketsPerUser,
    minParticipants,
    maxParticipants,
    sort = "most-members",
    page = 1,
    pageSize = 12,
  } = options;

  const userMembershipSubquery = db
    .select({
      poolId: poolMember.poolId,
    })
    .from(poolMember)
    .where(eq(poolMember.userId, userId))
    .as("user_membership");

  const conditions = [eq(pool.visibility, "public")];

  if (search) {
    const escapedSearch = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
    conditions.push(ilike(pool.name, `%${escapedSearch}%`));
  }
  if (minBracketsPerUser !== undefined) {
    conditions.push(gte(pool.maxBracketsPerUser, minBracketsPerUser));
  }
  if (maxBracketsPerUser !== undefined) {
    conditions.push(lte(pool.maxBracketsPerUser, maxBracketsPerUser));
  }
  if (minParticipants !== undefined) {
    conditions.push(gte(pool.maxParticipants, minParticipants));
  }
  if (maxParticipants !== undefined) {
    conditions.push(lte(pool.maxParticipants, maxParticipants));
  }

  const memberCount = sql<number>`coalesce(${memberCountSubquery.memberCount}, 0)`;
  const availableSpots = sql<number>`${pool.maxParticipants} - coalesce(${memberCountSubquery.memberCount}, 0)`;

  // Filter: only pools with available capacity
  conditions.push(
    sql`coalesce(${memberCountSubquery.memberCount}, 0) < ${pool.maxParticipants}`,
  );

  let orderBy;
  switch (sort) {
    case "most-available":
      orderBy = [desc(availableSpots), asc(pool.name)];
      break;
    case "fewest-brackets":
      orderBy = [asc(pool.maxBracketsPerUser), asc(pool.name)];
      break;
    case "most-brackets":
      orderBy = [desc(pool.maxBracketsPerUser), asc(pool.name)];
      break;
    case "alphabetical":
      orderBy = [asc(pool.name)];
      break;
    case "most-members":
    default:
      orderBy = [desc(memberCount), asc(pool.name)];
      break;
  }

  const offset = (page - 1) * pageSize;

  const isMember = sql<boolean>`${userMembershipSubquery.poolId} is not null`;

  const results = await db
    .select({
      id: pool.id,
      name: pool.name,
      imageUrl: pool.imageUrl,
      maxBracketsPerUser: pool.maxBracketsPerUser,
      maxParticipants: pool.maxParticipants,
      scoringFirstFour: pool.scoringFirstFour,
      scoringRound64: pool.scoringRound64,
      scoringRound32: pool.scoringRound32,
      scoringSweet16: pool.scoringSweet16,
      scoringElite8: pool.scoringElite8,
      scoringFinalFour: pool.scoringFinalFour,
      scoringChampionship: pool.scoringChampionship,
      memberCount,
      availableSpots,
      isMember,
    })
    .from(pool)
    .leftJoin(memberCountSubquery, eq(pool.id, memberCountSubquery.poolId))
    .leftJoin(
      userMembershipSubquery,
      eq(pool.id, userMembershipSubquery.poolId),
    )
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(pool)
    .leftJoin(memberCountSubquery, eq(pool.id, memberCountSubquery.poolId))
    .where(and(...conditions));

  return {
    pools: results,
    totalCount: totalResult.count,
    totalPages: Math.ceil(totalResult.count / pageSize),
    currentPage: page,
  };
}

export async function joinPublicPool(
  poolId: string,
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  // Check lock before entering transaction (uses db directly, not tx)
  const tournamentStarted = await hasTournamentStarted();
  if (tournamentStarted) {
    return {
      success: false,
      error: "Cannot join pools after the tournament has started.",
    };
  }

  return db.transaction(async (tx) => {
    const [poolData] = await tx
      .select({
        id: pool.id,
        visibility: pool.visibility,
        maxParticipants: pool.maxParticipants,
      })
      .from(pool)
      .where(eq(pool.id, poolId))
      .limit(1);

    if (!poolData) {
      return { success: false, error: "Pool not found." };
    }

    if (poolData.visibility !== "public") {
      return { success: false, error: "This pool is not public." };
    }

    const [existingMember] = await tx
      .select()
      .from(poolMember)
      .where(and(eq(poolMember.poolId, poolId), eq(poolMember.userId, userId)))
      .limit(1);

    if (existingMember) {
      return {
        success: false,
        error: "You are already a member of this pool.",
      };
    }

    const [memberCountResult] = await tx
      .select({ count: count() })
      .from(poolMember)
      .where(eq(poolMember.poolId, poolId));

    if (memberCountResult.count >= poolData.maxParticipants) {
      return { success: false, error: "This pool is full." };
    }

    await tx.insert(poolMember).values({
      poolId,
      userId,
      role: "member",
    });

    return { success: true };
  });
}
