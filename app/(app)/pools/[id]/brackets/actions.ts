"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPoolById } from "@/lib/db/queries/pools";
import { getActiveTournament } from "@/lib/db/queries/tournaments";
import {
  createBracketEntry,
  getBracketEntryById,
  getBracketEntryCountForUser,
  getPicksForEntry,
  savePick as savePickQuery,
  deletePicksForGames,
  updateTiebreaker as updateTiebreakerQuery,
  submitBracketEntry,
  unsubmitBracketEntry,
  deleteBracketEntry,
} from "@/lib/db/queries/bracket-entries";
import { getTournamentGames } from "@/lib/db/queries/tournaments";
import {
  createBracketEntrySchema,
  savePickSchema,
  updateTiebreakerSchema,
  submitBracketSchema,
} from "@/lib/validators/bracket-entry";
import { hasTournamentStarted } from "@/lib/db/queries/pools";

export async function createBracketEntryAction(
  poolId: string,
  formData: unknown,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = createBracketEntrySchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const poolData = await getPoolById(poolId, session.user.id);
  if (!poolData) {
    return { error: "Pool not found" };
  }

  const tournament = await getActiveTournament();
  if (!tournament) {
    return { error: "No active tournament" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Tournament has already started" };
  }

  const entryCount = await getBracketEntryCountForUser(poolId, session.user.id);
  if (entryCount >= poolData.pool.maxBracketsPerUser) {
    return {
      error: `You have reached the maximum of ${poolData.pool.maxBracketsPerUser} brackets for this pool`,
    };
  }

  const entry = await createBracketEntry({
    poolId,
    userId: session.user.id,
    tournamentId: tournament.id,
    name: parsed.data.name,
  });

  redirect(`/pools/${poolId}/brackets/${entry.id}`);
}

export async function savePickAction(
  bracketEntryId: string,
  tournamentGameId: string,
  pickedTeamId: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = savePickSchema.safeParse({
    bracketEntryId,
    tournamentGameId,
    pickedTeamId,
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  // Read-only checks before transaction
  const entry = await getBracketEntryById(parsed.data.bracketEntryId);
  if (!entry || entry.userId !== session.user.id) {
    return { error: "Bracket entry not found" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Tournament has already started" };
  }

  // All writes in a single transaction
  await db.transaction(async (tx) => {
    // Save the pick
    await savePickQuery(
      parsed.data.bracketEntryId,
      parsed.data.tournamentGameId,
      parsed.data.pickedTeamId,
      tx,
    );

    // Find downstream games that depend on this game and clear any picks
    // where the picked team is no longer valid
    const games = await getTournamentGames(entry.tournamentId);
    const picks = await getPicksForEntry(parsed.data.bracketEntryId, tx);
    const pickMap = new Map(picks.map((p) => [p.tournamentGameId, p]));

    const downstreamGameIds = findDownstreamGames(
      parsed.data.tournamentGameId,
      games,
    );

    const picksToRemove: string[] = [];
    for (const gameId of downstreamGameIds) {
      const existingPick = pickMap.get(gameId);
      if (existingPick) {
        const validTeams = getValidTeamsForGame(gameId, games, pickMap);
        if (!validTeams.has(existingPick.pickedTeamId)) {
          picksToRemove.push(gameId);
        }
      }
    }

    if (picksToRemove.length > 0) {
      await deletePicksForGames(parsed.data.bracketEntryId, picksToRemove, tx);
    }

    // If entry was submitted and picks changed, revert to draft
    if (entry.status === "submitted") {
      await unsubmitBracketEntry(parsed.data.bracketEntryId, tx);
    }
  });

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
}

export async function updateTiebreakerAction(
  bracketEntryId: string,
  tiebreakerScore: number,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = updateTiebreakerSchema.safeParse({
    bracketEntryId,
    tiebreakerScore,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const entry = await getBracketEntryById(parsed.data.bracketEntryId);
  if (!entry || entry.userId !== session.user.id) {
    return { error: "Bracket entry not found" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Tournament has already started" };
  }

  await updateTiebreakerQuery(
    parsed.data.bracketEntryId,
    parsed.data.tiebreakerScore,
  );

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
}

export async function submitBracketAction(bracketEntryId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = submitBracketSchema.safeParse({ bracketEntryId });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const entry = await getBracketEntryById(parsed.data.bracketEntryId);
  if (!entry || entry.userId !== session.user.id) {
    return { error: "Bracket entry not found" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Tournament has already started" };
  }

  if (entry.tiebreakerScore === null || entry.tiebreakerScore === undefined) {
    return { error: "Tiebreaker score is required" };
  }

  // Check all games are picked
  const games = await getTournamentGames(entry.tournamentId);
  const picks = await getPicksForEntry(parsed.data.bracketEntryId);

  const totalGames = games.length;

  if (picks.length < totalGames) {
    return {
      error: `All ${totalGames} games must be picked before submitting (${picks.length} picked)`,
    };
  }

  await submitBracketEntry(parsed.data.bracketEntryId);

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
}

export async function deleteBracketEntryAction(bracketEntryId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const entry = await getBracketEntryById(bracketEntryId);
  if (!entry || entry.userId !== session.user.id) {
    return { error: "Bracket entry not found" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Cannot delete bracket after tournament has started" };
  }

  await deleteBracketEntry(bracketEntryId);

  revalidatePath(`/pools/${entry.poolId}`);
  return { success: true, poolId: entry.poolId };
}

// Helper: find all games downstream of a given game (games that receive the winner)
function findDownstreamGames(
  gameId: string,
  games: {
    id: string;
    sourceGame1Id: string | null;
    sourceGame2Id: string | null;
  }[],
): string[] {
  const downstream: string[] = [];
  const queue = [gameId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const game of games) {
      if (game.sourceGame1Id === current || game.sourceGame2Id === current) {
        downstream.push(game.id);
        queue.push(game.id);
      }
    }
  }

  return downstream;
}

// Helper: get valid teams that can reach a game based on current picks
function getValidTeamsForGame(
  gameId: string,
  games: {
    id: string;
    sourceGame1Id: string | null;
    sourceGame2Id: string | null;
    team1Id: string | null;
    team2Id: string | null;
  }[],
  pickMap: Map<string, { pickedTeamId: string }>,
): Set<string> {
  const game = games.find((g) => g.id === gameId);
  if (!game) return new Set();

  const validTeams = new Set<string>();

  if (game.sourceGame1Id) {
    const pick = pickMap.get(game.sourceGame1Id);
    if (pick) validTeams.add(pick.pickedTeamId);
  } else if (game.team1Id) {
    validTeams.add(game.team1Id);
  }

  if (game.sourceGame2Id) {
    const pick = pickMap.get(game.sourceGame2Id);
    if (pick) validTeams.add(pick.pickedTeamId);
  } else if (game.team2Id) {
    validTeams.add(game.team2Id);
  }

  return validTeams;
}
