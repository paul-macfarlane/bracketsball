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
  getPoolMembers,
} from "@/lib/db/queries/pool-members";
import {
  searchUsersByUsername,
  createPoolUserInvite,
  cancelPoolUserInvite,
  getPendingInviteIdsForPool,
  getSentInvitesForPool,
} from "@/lib/db/queries/pool-user-invites";
import {
  searchUsersInputSchema,
  sendUserInviteInputSchema,
  cancelUserInviteInputSchema,
} from "@/lib/validators/pool-user-invite";
import { hasTournamentStarted } from "@/lib/db/queries/pools";

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

export async function searchUsersForInviteAction(
  poolId: string,
  query: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = searchUsersInputSchema.safeParse({
    poolId,
    formData: { query },
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "send-user-invite")) {
    return {
      error: "You do not have permission to search for users to invite",
    };
  }

  // Get existing member IDs and pending invite user IDs to exclude
  const members = await getPoolMembers(inputParsed.data.poolId);
  const memberUserIds = members.map((m) => m.userId);
  const pendingInviteUserIds = await getPendingInviteIdsForPool(
    inputParsed.data.poolId,
  );
  const excludeIds = [...new Set([...memberUserIds, ...pendingInviteUserIds])];

  const users = await searchUsersByUsername(
    inputParsed.data.formData.query,
    excludeIds,
  );

  return { success: true, users };
}

export async function sendPoolUserInviteAction(poolId: string, userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = sendUserInviteInputSchema.safeParse({
    poolId,
    formData: { userId },
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "send-user-invite")) {
    return { error: "You do not have permission to send invites" };
  }

  // Block invites after tournament has started
  const tournamentStarted = await hasTournamentStarted();
  if (tournamentStarted) {
    return { error: "Cannot send invites after the tournament has started" };
  }

  // Check pool capacity
  const remainingCapacity =
    poolData.pool.maxParticipants - poolData.memberCount;
  if (remainingCapacity <= 0) {
    return { error: "This pool is full" };
  }

  // Check if user is already a member
  const members = await getPoolMembers(inputParsed.data.poolId);
  if (members.some((m) => m.userId === inputParsed.data.formData.userId)) {
    return { error: "This user is already a member of this pool" };
  }

  // Check for existing pending invite
  const pendingInviteUserIds = await getPendingInviteIdsForPool(
    inputParsed.data.poolId,
  );
  if (pendingInviteUserIds.includes(inputParsed.data.formData.userId)) {
    return { error: "This user already has a pending invite to this pool" };
  }

  await createPoolUserInvite({
    poolId: inputParsed.data.poolId,
    invitedBy: session.user.id,
    invitedUserId: inputParsed.data.formData.userId,
  });

  return { success: true };
}

export async function cancelPoolUserInviteAction(
  poolId: string,
  inviteId: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = cancelUserInviteInputSchema.safeParse({
    poolId,
    inviteId,
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  const poolData = await getPoolById(inputParsed.data.poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  if (!canPerformPoolAction(poolData.membership.role, "cancel-user-invite")) {
    return { error: "You do not have permission to cancel invites" };
  }

  // Verify the invite belongs to this pool
  const sentInvites = await getSentInvitesForPool(inputParsed.data.poolId);
  const invite = sentInvites.find((i) => i.id === inputParsed.data.inviteId);
  if (!invite) {
    return { error: "Invite not found in this pool" };
  }

  await cancelPoolUserInvite(inputParsed.data.inviteId);

  return { success: true };
}
