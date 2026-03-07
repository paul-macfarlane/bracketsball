"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { canPerformPoolAction } from "@/lib/permissions/pools";
import { getPoolById } from "@/lib/db/queries/pools";
import {
  updatePoolMemberRole,
  removePoolMember,
  leavePool,
  getLeaderCount,
} from "@/lib/db/queries/pool-members";

const changeMemberRoleInputSchema = z.object({
  poolId: z.string().min(1),
  memberId: z.string().min(1),
  role: z.enum(["leader", "member"]),
});

export async function changeMemberRoleAction(
  poolId: string,
  memberId: string,
  role: "leader" | "member",
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = changeMemberRoleInputSchema.safeParse({
    poolId,
    memberId,
    role,
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "change-member-role")) {
    return { error: "You do not have permission to change member roles" };
  }

  // Prevent demoting self if last leader
  if (inputParsed.data.role === "member") {
    const leaderCount = await getLeaderCount(inputParsed.data.poolId);
    if (leaderCount <= 1) {
      // Check if we're demoting the target who is a leader
      // We need to verify the target is currently a leader
      return {
        error:
          "Cannot demote the last leader. Promote another member to leader first.",
      };
    }
  }

  const updated = await updatePoolMemberRole(
    inputParsed.data.memberId,
    inputParsed.data.role,
  );

  if (!updated) {
    return { error: "Member not found" };
  }

  return { success: true };
}

const removeMemberInputSchema = z.object({
  poolId: z.string().min(1),
  memberId: z.string().min(1),
});

export async function removeMemberAction(poolId: string, memberId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = removeMemberInputSchema.safeParse({ poolId, memberId });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "remove-member")) {
    return { error: "You do not have permission to remove members" };
  }

  // Don't allow removing yourself via this action (use leave instead)
  if (inputParsed.data.memberId === poolData.membership.id) {
    return { error: "Use the leave pool action to remove yourself" };
  }

  await removePoolMember(inputParsed.data.memberId);

  return { success: true };
}

const leavePoolInputSchema = z.object({
  poolId: z.string().min(1),
});

export async function leavePoolAction(poolId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = leavePoolInputSchema.safeParse({ poolId });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const result = await leavePool(inputParsed.data.poolId, session.user.id);

  if (!result.success) {
    return { error: result.error };
  }

  return { success: true, poolDeleted: result.poolDeleted };
}
