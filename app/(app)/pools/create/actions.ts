"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { createPoolSchema } from "@/lib/validators/pool";
import {
  createPoolWithLeader,
  hasTournamentStarted,
} from "@/lib/db/queries/pools";

export async function createPool(formData: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const tournamentStarted = await hasTournamentStarted();
  if (tournamentStarted) {
    return {
      error: "Pools cannot be created after the tournament has started",
    };
  }

  const parsed = createPoolSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const newPool = await createPoolWithLeader(parsed.data, session.user.id);

  redirect(`/pools/${newPool.id}`);
}
