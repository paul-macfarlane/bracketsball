"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getPublicPools, joinPublicPool } from "@/lib/db/queries/pools";
import {
  searchPublicPoolsSchema,
  joinPublicPoolSchema,
} from "@/lib/validators/pool";

export async function searchPublicPools(input: unknown) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = searchPublicPoolsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid search parameters" };
  }

  return getPublicPools({ ...parsed.data, userId: session.user.id });
}

export async function joinPublicPoolAction(poolId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = joinPublicPoolSchema.safeParse({ poolId });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const result = await joinPublicPool(parsed.data.poolId, session.user.id);

  if (!result.success) {
    return { error: result.error };
  }

  redirect(`/pools/${parsed.data.poolId}`);
}
