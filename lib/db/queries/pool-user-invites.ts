import { eq, and, count, ilike, notInArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolMember, poolUserInvite, user } from "@/lib/db/schema";

export async function searchUsersByUsername(
  query: string,
  excludeUserIds: string[],
  limit = 10,
) {
  const baseCondition = ilike(user.username, `%${query}%`);

  return db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
    })
    .from(user)
    .where(
      excludeUserIds.length > 0
        ? and(baseCondition, notInArray(user.id, excludeUserIds))
        : baseCondition,
    )
    .limit(limit);
}

interface CreatePoolUserInviteData {
  poolId: string;
  invitedBy: string;
  invitedUserId: string;
}

export async function createPoolUserInvite(data: CreatePoolUserInviteData) {
  const [invite] = await db
    .insert(poolUserInvite)
    .values({
      poolId: data.poolId,
      invitedBy: data.invitedBy,
      invitedUserId: data.invitedUserId,
      status: "pending",
    })
    .returning();

  return invite;
}

export async function getPendingInvitesForUser(userId: string) {
  // Use aliased references for sender info
  return db
    .select({
      id: poolUserInvite.id,
      poolId: poolUserInvite.poolId,
      poolName: pool.name,
      poolImageUrl: pool.imageUrl,
      senderName: user.name,
      senderImage: user.image,
      senderUsername: user.username,
      createdAt: poolUserInvite.createdAt,
    })
    .from(poolUserInvite)
    .innerJoin(pool, eq(poolUserInvite.poolId, pool.id))
    .innerJoin(user, eq(poolUserInvite.invitedBy, user.id))
    .where(
      and(
        eq(poolUserInvite.invitedUserId, userId),
        eq(poolUserInvite.status, "pending"),
      ),
    )
    .orderBy(poolUserInvite.createdAt);
}

export async function getPendingInviteCountForUser(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(poolUserInvite)
    .where(
      and(
        eq(poolUserInvite.invitedUserId, userId),
        eq(poolUserInvite.status, "pending"),
      ),
    );

  return result.count;
}

export async function respondToPoolUserInvite(
  inviteId: string,
  userId: string,
  response: "accepted" | "declined",
): Promise<
  { success: true; poolId: string } | { success: false; error: string }
> {
  return db.transaction(async (tx) => {
    const [invite] = await tx
      .select({
        id: poolUserInvite.id,
        poolId: poolUserInvite.poolId,
        invitedUserId: poolUserInvite.invitedUserId,
        status: poolUserInvite.status,
      })
      .from(poolUserInvite)
      .where(eq(poolUserInvite.id, inviteId))
      .limit(1);

    if (!invite) {
      return { success: false, error: "Invite not found." };
    }

    if (invite.invitedUserId !== userId) {
      return { success: false, error: "This invite is not for you." };
    }

    if (invite.status !== "pending") {
      return {
        success: false,
        error: "This invite has already been responded to.",
      };
    }

    if (response === "accepted") {
      // Check if already a member
      const [existingMember] = await tx
        .select()
        .from(poolMember)
        .where(
          and(
            eq(poolMember.poolId, invite.poolId),
            eq(poolMember.userId, userId),
          ),
        )
        .limit(1);

      if (existingMember) {
        // Update invite status but don't add again
        await tx
          .update(poolUserInvite)
          .set({ status: "accepted", respondedAt: new Date() })
          .where(eq(poolUserInvite.id, inviteId));

        return {
          success: false,
          error: "You are already a member of this pool.",
        };
      }

      // Check pool capacity
      const [poolData] = await tx
        .select({ maxParticipants: pool.maxParticipants })
        .from(pool)
        .where(eq(pool.id, invite.poolId))
        .limit(1);

      if (!poolData) {
        return { success: false, error: "Pool not found." };
      }

      const [memberCountResult] = await tx
        .select({ count: count() })
        .from(poolMember)
        .where(eq(poolMember.poolId, invite.poolId));

      if (memberCountResult.count >= poolData.maxParticipants) {
        return { success: false, error: "This pool is full." };
      }

      // Add user to pool
      await tx.insert(poolMember).values({
        poolId: invite.poolId,
        userId,
        role: "member",
      });
    }

    // Update invite status
    await tx
      .update(poolUserInvite)
      .set({ status: response, respondedAt: new Date() })
      .where(eq(poolUserInvite.id, inviteId));

    return { success: true, poolId: invite.poolId };
  });
}

export async function getSentInvitesForPool(poolId: string) {
  return db
    .select({
      id: poolUserInvite.id,
      status: poolUserInvite.status,
      createdAt: poolUserInvite.createdAt,
      respondedAt: poolUserInvite.respondedAt,
      recipientName: user.name,
      recipientImage: user.image,
      recipientUsername: user.username,
    })
    .from(poolUserInvite)
    .innerJoin(user, eq(poolUserInvite.invitedUserId, user.id))
    .where(eq(poolUserInvite.poolId, poolId))
    .orderBy(poolUserInvite.createdAt);
}

export async function cancelPoolUserInvite(inviteId: string) {
  await db.delete(poolUserInvite).where(eq(poolUserInvite.id, inviteId));
}

export async function getPendingInviteIdsForPool(poolId: string) {
  const results = await db
    .select({ invitedUserId: poolUserInvite.invitedUserId })
    .from(poolUserInvite)
    .where(
      and(
        eq(poolUserInvite.poolId, poolId),
        eq(poolUserInvite.status, "pending"),
      ),
    );

  return results.map((r) => r.invitedUserId);
}
