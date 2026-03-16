"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  createTournamentSchema,
  addTournamentTeamSchema,
  updateGameSchema,
  updateTournamentTeamStatsSchema,
  bracketPositionsSchema,
} from "@/lib/validators/tournament";
import { db } from "@/lib/db";
import { tournamentGame } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createTournament,
  updateTournament,
  deleteTournament,
  addTeamToTournament,
  updateTournamentTeam,
  updateTournamentTeamStats,
  removeTeamFromTournament,
  getTournamentTeams,
  getTournamentGames,
  getTournamentById,
} from "@/lib/db/queries/tournaments";
import { syncTeamStats } from "@/lib/espn-sync/sync-team-stats";

// Standard NCAA bracket seeding matchups for R64
const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.appRole !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function hasAnyGameStarted(tournamentId: string) {
  const games = await getTournamentGames(tournamentId);
  return games.some((g) => g.status === "in_progress" || g.status === "final");
}

/**
 * After team roster or seed changes, re-sync team placements in R64 games.
 * Only updates games that are still in "scheduled" status.
 */
async function syncBracketTeams(tournamentId: string) {
  const [teams, games] = await Promise.all([
    getTournamentTeams(tournamentId),
    getTournamentGames(tournamentId),
  ]);

  if (games.length === 0) return;

  // Build lookup: region -> seed -> teamId
  const teamLookup = new Map<string, Map<number, string>>();
  for (const tt of teams) {
    if (!teamLookup.has(tt.region)) {
      teamLookup.set(tt.region, new Map());
    }
    // For duplicate seeds (First Four), the first one wins in the map.
    // First Four games handle these separately — R64 games with sourceGame
    // references won't use the lookup anyway.
    const regionMap = teamLookup.get(tt.region)!;
    if (!regionMap.has(tt.seed)) {
      regionMap.set(tt.seed, tt.teamId);
    }
  }

  // Find seeds that have duplicates (First Four play-in seeds)
  const firstFourSeeds = new Map<string, Set<number>>();
  for (const tt of teams) {
    if (!firstFourSeeds.has(tt.region)) {
      firstFourSeeds.set(tt.region, new Set());
    }
    const count = teams.filter(
      (t) => t.region === tt.region && t.seed === tt.seed,
    ).length;
    if (count > 1) {
      firstFourSeeds.get(tt.region)!.add(tt.seed);
    }
  }

  const r64Games = games.filter((g) => g.round === "round_of_64");

  await db.transaction(async (tx) => {
    for (const game of r64Games) {
      if (game.status !== "scheduled") continue;
      if (!game.region) continue;

      const region = game.region;
      const matchup = R64_SEED_MATCHUPS[game.gameNumber - 1];
      if (!matchup) continue;

      const [highSeed, lowSeed] = matchup;
      const seeds = teamLookup.get(region);
      const ffSeeds = firstFourSeeds.get(region) ?? new Set();

      // If this seed has a First Four game feeding into it, don't override the team
      // (it comes from a sourceGame reference instead)
      const team1Id =
        game.sourceGame1Id || ffSeeds.has(highSeed)
          ? game.team1Id
          : (seeds?.get(highSeed) ?? null);
      const team2Id =
        game.sourceGame2Id || ffSeeds.has(lowSeed)
          ? game.team2Id
          : (seeds?.get(lowSeed) ?? null);

      if (team1Id !== game.team1Id || team2Id !== game.team2Id) {
        await tx
          .update(tournamentGame)
          .set({ team1Id, team2Id })
          .where(eq(tournamentGame.id, game.id));
      }
    }
  });
}

export async function createTournamentAction(formData: unknown) {
  await requireAdmin();
  const parsed = createTournamentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createTournament(parsed.data);
  redirect(`/admin/tournaments/${result.id}`);
}

export async function updateTournamentAction(id: string, formData: unknown) {
  await requireAdmin();
  const parsed = createTournamentSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateTournament(id, parsed.data);
  if (!result) {
    return { error: "Tournament not found" };
  }

  revalidatePath(`/admin/tournaments/${id}`);
  revalidatePath("/admin/tournaments");
}

export async function deleteTournamentAction(id: string) {
  await requireAdmin();
  await deleteTournament(id);
  redirect("/admin/tournaments");
}

export async function toggleTournamentActiveAction(
  id: string,
  isActive: boolean,
) {
  await requireAdmin();
  await updateTournament(id, { isActive });
  revalidatePath(`/admin/tournaments/${id}`);
  revalidatePath("/admin/tournaments");
}

export async function addTeamToTournamentAction(
  tournamentId: string,
  formData: unknown,
) {
  await requireAdmin();

  if (await hasAnyGameStarted(tournamentId)) {
    return {
      error:
        "Cannot modify teams after a game has started. Reset all games to scheduled first.",
    };
  }

  const parsed = addTournamentTeamSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await addTeamToTournament({
      tournamentId,
      ...parsed.data,
    });
  } catch {
    return { error: "Team may already be in this tournament" };
  }

  await syncBracketTeams(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function updateTournamentTeamAction(
  tournamentId: string,
  tournamentTeamId: string,
  formData: unknown,
) {
  await requireAdmin();

  if (await hasAnyGameStarted(tournamentId)) {
    return {
      error:
        "Cannot modify teams after a game has started. Reset all games to scheduled first.",
    };
  }

  const parsed = addTournamentTeamSchema
    .pick({ seed: true, region: true })
    .safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateTournamentTeam(tournamentTeamId, parsed.data);
  if (!result) {
    return { error: "Tournament team not found" };
  }

  await syncBracketTeams(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function removeTeamFromTournamentAction(
  tournamentId: string,
  tournamentTeamId: string,
) {
  await requireAdmin();

  if (await hasAnyGameStarted(tournamentId)) {
    return {
      error:
        "Cannot modify teams after a game has started. Reset all games to scheduled first.",
    };
  }

  await removeTeamFromTournament(tournamentTeamId);
  await syncBracketTeams(tournamentId);
  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function updateBracketPositionsAction(
  tournamentId: string,
  formData: unknown,
) {
  await requireAdmin();

  if (await hasAnyGameStarted(tournamentId)) {
    return {
      error:
        "Cannot modify bracket positions after a game has started. Reset all games to scheduled first.",
    };
  }

  const parsed = bracketPositionsSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateTournament(tournamentId, parsed.data);
  if (!result) {
    return { error: "Tournament not found" };
  }

  // Re-wire Final Four source game references to match the new positions
  const games = await getTournamentGames(tournamentId);
  if (games.length > 0) {
    const elite8Games = games.filter((g) => g.round === "elite_8");
    const finalFourGames = games.filter((g) => g.round === "final_four");

    if (elite8Games.length === 4 && finalFourGames.length === 2) {
      const e8ByRegion = new Map(elite8Games.map((g) => [g.region, g]));

      const topLeftE8 = e8ByRegion.get(parsed.data.bracketTopLeftRegion);
      const bottomLeftE8 = e8ByRegion.get(parsed.data.bracketBottomLeftRegion);
      const topRightE8 = e8ByRegion.get(parsed.data.bracketTopRightRegion);
      const bottomRightE8 = e8ByRegion.get(
        parsed.data.bracketBottomRightRegion,
      );

      if (topLeftE8 && bottomLeftE8 && topRightE8 && bottomRightE8) {
        // Sort FF games by gameNumber so assignment is stable
        const sorted = [...finalFourGames].sort(
          (a, b) => a.gameNumber - b.gameNumber,
        );

        await db.transaction(async (tx) => {
          // FF game 1 (left side): top-left vs bottom-left
          await tx
            .update(tournamentGame)
            .set({
              sourceGame1Id: topLeftE8.id,
              sourceGame2Id: bottomLeftE8.id,
            })
            .where(eq(tournamentGame.id, sorted[0].id));

          // FF game 2 (right side): top-right vs bottom-right
          await tx
            .update(tournamentGame)
            .set({
              sourceGame1Id: topRightE8.id,
              sourceGame2Id: bottomRightE8.id,
            })
            .where(eq(tournamentGame.id, sorted[1].id));
        });
      }
    }
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`);
  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function updateGameAction(
  gameId: string,
  tournamentId: string,
  formData: unknown,
) {
  await requireAdmin();
  const parsed = updateGameSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const games = await getTournamentGames(tournamentId);
  const currentGame = games.find((g) => g.id === gameId);
  if (!currentGame) {
    return { error: "Game not found" };
  }

  // Auto-determine winner from scores when status is "final"
  let winnerTeamId: string | null = null;
  if (
    parsed.data.status === "final" &&
    parsed.data.team1Score !== null &&
    parsed.data.team1Score !== undefined &&
    parsed.data.team2Score !== null &&
    parsed.data.team2Score !== undefined
  ) {
    if (parsed.data.team1Score > parsed.data.team2Score) {
      winnerTeamId = currentGame.team1Id;
    } else if (parsed.data.team2Score > parsed.data.team1Score) {
      winnerTeamId = currentGame.team2Id;
    }
    // Tied scores: no winner auto-set
  }

  if (
    parsed.data.status === "final" &&
    !winnerTeamId &&
    parsed.data.team1Score === parsed.data.team2Score
  ) {
    return {
      error:
        "Scores are tied — winner cannot be auto-determined. Please adjust scores.",
    };
  }

  // Build update data, converting startTime string to Date
  const { startTime: startTimeStr, ...restData } = parsed.data;
  const updateData: Record<string, unknown> = {
    ...restData,
    winnerTeamId,
  };
  if (startTimeStr !== undefined) {
    updateData.startTime = startTimeStr ? new Date(startTimeStr) : null;
  }

  const nextGame = games.find(
    (g) => g.sourceGame1Id === gameId || g.sourceGame2Id === gameId,
  );

  // If resetting a completed game (changing status away from final, or clearing winner)
  const isResetting =
    currentGame.status === "final" && parsed.data.status !== "final";

  if (isResetting && nextGame) {
    if (nextGame.status === "in_progress" || nextGame.status === "final") {
      return {
        error:
          "Cannot reset this game because the next round game is already in progress or completed. Undo that game first.",
      };
    }
  }

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(tournamentGame)
      .set(updateData)
      .where(eq(tournamentGame.id, gameId))
      .returning();

    if (!result) {
      throw new Error("Game not found");
    }

    if (nextGame) {
      if (isResetting) {
        // Remove this game's winner from the next round game
        const update =
          nextGame.sourceGame1Id === gameId
            ? { team1Id: null }
            : { team2Id: null };
        await tx
          .update(tournamentGame)
          .set(update)
          .where(eq(tournamentGame.id, nextGame.id));
      } else if (parsed.data.status === "final" && winnerTeamId) {
        // Advance the winner to the next round
        const update =
          nextGame.sourceGame1Id === gameId
            ? { team1Id: winnerTeamId }
            : { team2Id: winnerTeamId };
        await tx
          .update(tournamentGame)
          .set(update)
          .where(eq(tournamentGame.id, nextGame.id));
      }
    }
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function updateBracketLockTimeAction(
  tournamentId: string,
  lockTime: string | null,
) {
  await requireAdmin();

  const bracketLockTime = lockTime ? new Date(lockTime) : null;

  if (lockTime && isNaN(bracketLockTime!.getTime())) {
    return { error: "Invalid date format" };
  }

  const result = await updateTournament(tournamentId, {
    bracketLockTime,
    bracketLockTimeManual: true,
  });

  if (!result) {
    return { error: "Tournament not found" };
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

export async function resetBracketLockTimeAction(
  tournamentId: string,
): Promise<{ error: string } | undefined> {
  await requireAdmin();

  // Recalculate from R64 game schedule and clear manual flag
  const games = await getTournamentGames(tournamentId);
  const r64Games = games.filter((g) => g.round === "round_of_64");
  const startTimes = r64Games
    .map((g) => g.startTime)
    .filter((t): t is Date => t !== null);

  const earliestR64 =
    startTimes.length > 0
      ? new Date(Math.min(...startTimes.map((t) => t.getTime())))
      : null;

  const result = await updateTournament(tournamentId, {
    bracketLockTime: earliestR64,
    bracketLockTimeManual: false,
  });

  if (!result) {
    return { error: "Tournament not found" };
  }

  revalidatePath(`/admin/tournaments/${tournamentId}`);
}

export async function updateTournamentTeamStatsAction(
  tournamentId: string,
  tournamentTeamId: string,
  formData: unknown,
) {
  await requireAdmin();
  const parsed = updateTournamentTeamStatsSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await updateTournamentTeamStats(tournamentTeamId, parsed.data);
  if (!result) {
    return { error: "Tournament team not found" };
  }

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
}

export async function syncTeamStatsAction(tournamentId: string) {
  await requireAdmin();

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: "Tournament not found." };
  }

  const result = await syncTeamStats(tournamentId, undefined, tournament.year);

  revalidatePath(`/admin/tournaments/${tournamentId}/teams`);
  return {
    success: true,
    teamsUpdated: result.teamsUpdated,
    teamsSkipped: result.teamsSkipped,
    errors: result.errors,
  };
}
