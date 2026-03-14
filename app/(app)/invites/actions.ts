"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { respondToPoolUserInvite } from "@/lib/db/queries/pool-user-invites";

const respondToInviteInputSchema = z.object({
  inviteId: z.string().min(1),
  response: z.enum(["accepted", "declined"]),
});

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
