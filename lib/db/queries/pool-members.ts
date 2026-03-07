import { eq, and, count } from "drizzle-orm";

import { db } from "@/lib/db";
import { pool, poolMember, user } from "@/lib/db/schema";

export async function getPoolMembers(poolId: string) {
  return db
    .select({
      id: poolMember.id,
      userId: poolMember.userId,
      role: poolMember.role,
      joinedAt: poolMember.joinedAt,
      userName: user.name,
      userImage: user.image,
      userUsername: user.username,
    })
    .from(poolMember)
    .innerJoin(user, eq(poolMember.userId, user.id))
    .where(eq(poolMember.poolId, poolId))
    .orderBy(poolMember.joinedAt);
}

export async function updatePoolMemberRole(
  memberId: string,
  role: "leader" | "member",
) {
  const [updated] = await db
    .update(poolMember)
    .set({ role })
    .where(eq(poolMember.id, memberId))
    .returning();

  return updated;
}

export async function removePoolMember(memberId: string) {
  // TODO: Also delete bracket entries for this member when bracket_entry table exists (Story #9)
  await db.delete(poolMember).where(eq(poolMember.id, memberId));
}

export async function getLeaderCount(poolId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(poolMember)
    .where(and(eq(poolMember.poolId, poolId), eq(poolMember.role, "leader")));

  return result.count;
}

export async function getPoolMemberCount(poolId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(poolMember)
    .where(eq(poolMember.poolId, poolId));

  return result.count;
}

export async function leavePool(
  poolId: string,
  userId: string,
): Promise<
  { success: true; poolDeleted: boolean } | { success: false; error: string }
> {
  return db.transaction(async (tx) => {
    const [membership] = await tx
      .select()
      .from(poolMember)
      .where(and(eq(poolMember.poolId, poolId), eq(poolMember.userId, userId)))
      .limit(1);

    if (!membership) {
      return { success: false, error: "You are not a member of this pool." };
    }

    const [memberCountResult] = await tx
      .select({ count: count() })
      .from(poolMember)
      .where(eq(poolMember.poolId, poolId));

    // If sole member, delete the entire pool
    if (memberCountResult.count === 1) {
      await tx.delete(pool).where(eq(pool.id, poolId));
      return { success: true, poolDeleted: true };
    }

    // If leader, check that there's at least one other leader
    if (membership.role === "leader") {
      const [leaderCountResult] = await tx
        .select({ count: count() })
        .from(poolMember)
        .where(
          and(eq(poolMember.poolId, poolId), eq(poolMember.role, "leader")),
        );

      if (leaderCountResult.count <= 1) {
        return {
          success: false,
          error:
            "You are the only leader. Promote another member to leader before leaving.",
        };
      }
    }

    // TODO: Also delete bracket entries for this member when bracket_entry table exists (Story #9)
    await tx
      .delete(poolMember)
      .where(and(eq(poolMember.poolId, poolId), eq(poolMember.userId, userId)));

    return { success: true, poolDeleted: false };
  });
}
