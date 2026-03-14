"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { respondToPoolUserInvite } from "@/lib/db/queries/pool-user-invites";
import { hasTournamentStarted } from "@/lib/db/queries/pools";
import { respondToInviteInputSchema } from "@/lib/validators/pool-user-invite";

export async function respondToInviteAction(
  inviteId: string,
  response: "accepted" | "declined",
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const inputParsed = respondToInviteInputSchema.safeParse({
    inviteId,
    response,
  });
  if (!inputParsed.success) {
    return { error: "Invalid input" };
  }

  if (inputParsed.data.response === "accepted") {
    const tournamentStarted = await hasTournamentStarted();
    if (tournamentStarted) {
      return {
        error: "Pools cannot be joined after the tournament has started",
      };
    }
  }

  const result = await respondToPoolUserInvite(
    inputParsed.data.inviteId,
    session.user.id,
    inputParsed.data.response,
  );

  if (!result.success) {
    return { error: result.error };
  }

  return { success: true, poolId: result.poolId };
}
