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
  getBracketEntriesByPoolAndUser,
  getPicksForEntry,
  savePick as savePickQuery,
  savePicksBatch,
  deletePicksForGames,
  clearAllPicks,
  updateBracketEntryName,
  updateTiebreaker as updateTiebreakerQuery,
  submitBracketEntry,
  unsubmitBracketEntry,
  deleteBracketEntry,
} from "@/lib/db/queries/bracket-entries";
import {
  getTournamentGames,
  getTournamentTeams,
} from "@/lib/db/queries/tournaments";
import {
  autoFillBracket,
  type AutoFillStrategy,
  type StatsAutoFillConfig,
} from "@/lib/bracket-auto-fill";
import type { BracketTeam } from "@/components/bracket/types";
import {
  createBracketEntrySchema,
  updateBracketNameSchema,
  savePickSchema,
  updateTiebreakerSchema,
  submitBracketSchema,
  autoFillBracketSchema,
  clearBracketSchema,
  duplicateBracketSchema,
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

  const entryCount = await getBracketEntryCountForUser(
    poolId,
    session.user.id,
    tournament.id,
  );
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

export async function updateBracketNameAction(
  bracketEntryId: string,
  name: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = updateBracketNameSchema.safeParse({ bracketEntryId, name });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const entry = await getBracketEntryById(parsed.data.bracketEntryId);
  if (!entry || entry.userId !== session.user.id) {
    return { error: "Bracket entry not found" };
  }

  await updateBracketEntryName(parsed.data.bracketEntryId, parsed.data.name);

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
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
  const games = await getTournamentGames(entry.tournamentId);

  // Block picks for games that have already started (e.g. First Four)
  const targetGame = games.find((g) => g.id === parsed.data.tournamentGameId);
  if (targetGame && targetGame.status !== "scheduled") {
    return { error: "This game has already started" };
  }

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

  // Check all pickable games are picked (exclude started/finished games)
  const games = await getTournamentGames(entry.tournamentId);
  const picks = await getPicksForEntry(parsed.data.bracketEntryId);

  const pickableGames = games.filter((g) => g.status === "scheduled");
  const pickableGameIds = new Set(pickableGames.map((g) => g.id));
  const pickedPickableCount = picks.filter((p) =>
    pickableGameIds.has(p.tournamentGameId),
  ).length;

  if (pickedPickableCount < pickableGames.length) {
    return {
      error: `All ${pickableGames.length} games must be picked before submitting (${pickedPickableCount} picked)`,
    };
  }

  await submitBracketEntry(parsed.data.bracketEntryId);

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
}

export async function unsubmitBracketAction(bracketEntryId: string) {
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

  if (entry.status !== "submitted") {
    return { error: "Bracket is not submitted" };
  }

  const started = await hasTournamentStarted();
  if (started) {
    return { error: "Cannot edit bracket after tournament has started" };
  }

  await unsubmitBracketEntry(parsed.data.bracketEntryId);

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

export async function autoFillBracketAction(
  bracketEntryId: string,
  strategy: AutoFillStrategy,
  statsConfig?: StatsAutoFillConfig,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = autoFillBracketSchema.safeParse({
    bracketEntryId,
    strategy,
    statsConfig,
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

  const [games, tournamentTeamsRaw, existingPicks] = await Promise.all([
    getTournamentGames(entry.tournamentId),
    getTournamentTeams(entry.tournamentId),
    getPicksForEntry(parsed.data.bracketEntryId),
  ]);

  const isStatsStrategy = parsed.data.strategy === "stats_custom";
  const tournamentTeams: BracketTeam[] = tournamentTeamsRaw.map((tt) => ({
    id: tt.teamId,
    name: tt.teamName,
    shortName: tt.teamShortName,
    abbreviation: tt.teamAbbreviation,
    mascot: tt.teamMascot,
    logoUrl: tt.teamLogoUrl,
    darkLogoUrl: tt.teamDarkLogoUrl,
    seed: tt.seed,
    region: tt.region,
    ...(isStatsStrategy && {
      stats: {
        overallWins: tt.overallWins,
        overallLosses: tt.overallLosses,
        conferenceWins: tt.conferenceWins,
        conferenceLosses: tt.conferenceLosses,
        conferenceName: tt.conferenceName,
        ppg: tt.ppg,
        oppPpg: tt.oppPpg,
        fgPct: tt.fgPct,
        threePtPct: tt.threePtPct,
        ftPct: tt.ftPct,
        reboundsPerGame: tt.reboundsPerGame,
        assistsPerGame: tt.assistsPerGame,
        stealsPerGame: tt.stealsPerGame,
        blocksPerGame: tt.blocksPerGame,
        turnoversPerGame: tt.turnoversPerGame,
        apRanking: tt.apRanking,
        strengthOfSchedule: tt.strengthOfSchedule,
        strengthOfScheduleRank: tt.strengthOfScheduleRank,
        strengthOfRecord: tt.strengthOfRecord,
        strengthOfRecordRank: tt.strengthOfRecordRank,
        bpi: tt.bpi,
        bpiOffense: tt.bpiOffense,
        bpiDefense: tt.bpiDefense,
        bpiRank: tt.bpiRank,
        bpiOffenseRank: tt.bpiOffenseRank,
        bpiDefenseRank: tt.bpiDefenseRank,
      },
    }),
  }));

  const bracketPicks = existingPicks.map((p) => ({
    tournamentGameId: p.tournamentGameId,
    pickedTeamId: p.pickedTeamId,
  }));

  const result = autoFillBracket(
    games,
    tournamentTeams,
    bracketPicks,
    parsed.data.strategy,
    parsed.data.statsConfig,
  );

  if (result.picks.length === 0) {
    return { error: "All games are already picked" };
  }

  await db.transaction(async (tx) => {
    await savePicksBatch(parsed.data.bracketEntryId, result.picks, tx);
    await updateTiebreakerQuery(
      parsed.data.bracketEntryId,
      result.tiebreakerScore,
      tx,
    );

    // If entry was submitted, revert to draft since picks changed
    if (entry.status === "submitted") {
      await unsubmitBracketEntry(parsed.data.bracketEntryId, tx);
    }
  });

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return {
    success: true,
    picks: result.picks,
    tiebreakerScore: result.tiebreakerScore,
  };
}

export async function clearBracketAction(bracketEntryId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = clearBracketSchema.safeParse({ bracketEntryId });
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

  await db.transaction(async (tx) => {
    await clearAllPicks(parsed.data.bracketEntryId, tx);
    await updateTiebreakerQuery(parsed.data.bracketEntryId, 0, tx);

    if (entry.status === "submitted") {
      await unsubmitBracketEntry(parsed.data.bracketEntryId, tx);
    }
  });

  revalidatePath(`/pools/${entry.poolId}/brackets/${entry.id}`);
  return { success: true };
}

export async function duplicateBracketEntryAction(
  poolId: string,
  sourceBracketEntryId: string,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: "Not authenticated" };
  }

  const parsed = duplicateBracketSchema.safeParse({
    bracketEntryId: sourceBracketEntryId,
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
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

  const entryCount = await getBracketEntryCountForUser(
    poolId,
    session.user.id,
    tournament.id,
  );
  if (entryCount >= poolData.pool.maxBracketsPerUser) {
    return {
      error: `You have reached the maximum of ${poolData.pool.maxBracketsPerUser} brackets for this pool`,
    };
  }

  const sourceEntry = await getBracketEntryById(parsed.data.bracketEntryId);
  if (
    !sourceEntry ||
    sourceEntry.poolId !== poolId ||
    sourceEntry.userId !== session.user.id
  ) {
    return { error: "Bracket entry not found" };
  }

  // Generate unique name with (Copy), (Copy 2), etc.
  const existingEntries = await getBracketEntriesByPoolAndUser(
    poolId,
    session.user.id,
    tournament.id,
  );
  const existingNames = new Set(existingEntries.map((e) => e.name));

  // Generate unique name, truncating the base name to leave room for the suffix
  const suffix = " (Copy)";
  const maxBaseLength = 100 - suffix.length;
  const baseName =
    sourceEntry.name.length > maxBaseLength
      ? sourceEntry.name.slice(0, maxBaseLength)
      : sourceEntry.name;

  let newName = `${baseName} (Copy)`;
  if (existingNames.has(newName)) {
    let counter = 2;
    while (existingNames.has(`${baseName} (Copy ${counter})`)) {
      counter++;
    }
    newName = `${baseName} (Copy ${counter})`;
  }

  // Final safety truncation (e.g., if counter digits push past 100)
  if (newName.length > 100) {
    newName = newName.slice(0, 100);
  }

  const sourcePicks = await getPicksForEntry(parsed.data.bracketEntryId);

  const newEntry = await db.transaction(async (tx) => {
    const entry = await createBracketEntry(
      {
        poolId,
        userId: session.user.id,
        tournamentId: tournament.id,
        name: newName,
      },
      tx,
    );

    if (sourcePicks.length > 0) {
      await savePicksBatch(
        entry.id,
        sourcePicks.map((p) => ({
          tournamentGameId: p.tournamentGameId,
          pickedTeamId: p.pickedTeamId,
        })),
        tx,
      );
    }

    if (sourceEntry.tiebreakerScore !== null) {
      await updateTiebreakerQuery(entry.id, sourceEntry.tiebreakerScore, tx);
    }

    return entry;
  });

  revalidatePath(`/pools/${poolId}`);
  return { success: true, newEntryId: newEntry.id, poolId };
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
