import { eq, and, count, inArray } from "drizzle-orm";

import { db, type DbClient } from "@/lib/db";
import { bracketEntry, bracketPick } from "@/lib/db/schema";

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
) {
  const [updated] = await db
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
