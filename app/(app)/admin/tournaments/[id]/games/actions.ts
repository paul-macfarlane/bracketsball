"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentGame } from "@/lib/db/schema";
import {
  getTournamentById,
  getTournamentTeams,
  getTournamentGames,
} from "@/lib/db/queries/tournaments";
import { syncStandingsForTournament } from "@/lib/db/queries/standings";
import { syncTournament } from "@/lib/espn-sync/sync";
import { espnAdapter } from "@/lib/espn-sync/espn-adapter";

async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || session.user.appRole !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// Standard NCAA bracket seeding matchups for R64
// Each pair is [higher seed, lower seed]
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

const REGIONS = ["south", "east", "west", "midwest"] as const;

export async function generateBracketAction(tournamentId: string) {
  await requireAdmin();

  const existingGames = await getTournamentGames(tournamentId);
  if (existingGames.length > 0) {
    return { error: "Bracket already has games. Delete existing games first." };
  }

  const tournamentData = await getTournamentById(tournamentId);
  if (!tournamentData) {
    return { error: "Tournament not found." };
  }

  if (
    !tournamentData.bracketTopLeftRegion ||
    !tournamentData.bracketBottomLeftRegion ||
    !tournamentData.bracketTopRightRegion ||
    !tournamentData.bracketBottomRightRegion
  ) {
    return {
      error:
        "Bracket region positions must be configured before generating the bracket.",
    };
  }

  const tournamentTeams = await getTournamentTeams(tournamentId);
  if (tournamentTeams.length !== 68) {
    return { error: `Need exactly 68 teams, found ${tournamentTeams.length}.` };
  }

  // Build lookup: region -> seed -> teamId
  const teamLookup = new Map<string, Map<number, string>>();
  for (const tt of tournamentTeams) {
    if (!teamLookup.has(tt.region)) {
      teamLookup.set(tt.region, new Map());
    }
    teamLookup.get(tt.region)!.set(tt.seed, tt.teamId);
  }

  await db.transaction(async (tx) => {
    // Track created game IDs for linking bracket tree
    const gameIdMap = new Map<string, string>();

    // Helper to insert a game within the transaction
    async function insertGame(data: typeof tournamentGame.$inferInsert) {
      const [game] = await tx.insert(tournamentGame).values(data).returning();
      return game;
    }

    // Create Round of 64 games (8 games per region = 32 total)
    for (const region of REGIONS) {
      const seeds = teamLookup.get(region);
      if (!seeds) continue;

      for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
        const [highSeed, lowSeed] = R64_SEED_MATCHUPS[i];
        const gameNumber = i + 1;

        const game = await insertGame({
          tournamentId,
          round: "round_of_64",
          region,
          gameNumber,
          team1Id: seeds.get(highSeed) ?? null,
          team2Id: seeds.get(lowSeed) ?? null,
        });

        gameIdMap.set(`${region}-round_of_64-${gameNumber}`, game.id);
      }
    }

    // Create Round of 32 (4 games per region = 16 total)
    for (const region of REGIONS) {
      for (let i = 0; i < 4; i++) {
        const gameNumber = i + 1;
        const game = await insertGame({
          tournamentId,
          round: "round_of_32",
          region,
          gameNumber,
          sourceGame1Id:
            gameIdMap.get(`${region}-round_of_64-${i * 2 + 1}`) ?? null,
          sourceGame2Id:
            gameIdMap.get(`${region}-round_of_64-${i * 2 + 2}`) ?? null,
        });
        gameIdMap.set(`${region}-round_of_32-${gameNumber}`, game.id);
      }
    }

    // Create Sweet 16 (2 games per region = 8 total)
    for (const region of REGIONS) {
      for (let i = 0; i < 2; i++) {
        const gameNumber = i + 1;
        const game = await insertGame({
          tournamentId,
          round: "sweet_16",
          region,
          gameNumber,
          sourceGame1Id:
            gameIdMap.get(`${region}-round_of_32-${i * 2 + 1}`) ?? null,
          sourceGame2Id:
            gameIdMap.get(`${region}-round_of_32-${i * 2 + 2}`) ?? null,
        });
        gameIdMap.set(`${region}-sweet_16-${gameNumber}`, game.id);
      }
    }

    // Create Elite 8 (1 game per region = 4 total)
    for (const region of REGIONS) {
      const game = await insertGame({
        tournamentId,
        round: "elite_8",
        region,
        gameNumber: 1,
        sourceGame1Id: gameIdMap.get(`${region}-sweet_16-1`) ?? null,
        sourceGame2Id: gameIdMap.get(`${region}-sweet_16-2`) ?? null,
      });
      gameIdMap.set(`${region}-elite_8-1`, game.id);
    }

    // Create Final Four (2 games based on configured bracket positions)
    // Left side regions play each other, right side regions play each other
    const ff1 = await insertGame({
      tournamentId,
      round: "final_four",
      gameNumber: 1,
      sourceGame1Id:
        gameIdMap.get(`${tournamentData.bracketTopLeftRegion}-elite_8-1`) ??
        null,
      sourceGame2Id:
        gameIdMap.get(`${tournamentData.bracketBottomLeftRegion}-elite_8-1`) ??
        null,
    });
    gameIdMap.set("final_four-1", ff1.id);

    const ff2 = await insertGame({
      tournamentId,
      round: "final_four",
      gameNumber: 2,
      sourceGame1Id:
        gameIdMap.get(`${tournamentData.bracketTopRightRegion}-elite_8-1`) ??
        null,
      sourceGame2Id:
        gameIdMap.get(`${tournamentData.bracketBottomRightRegion}-elite_8-1`) ??
        null,
    });
    gameIdMap.set("final_four-2", ff2.id);

    // Create Championship (1 game)
    await insertGame({
      tournamentId,
      round: "championship",
      gameNumber: 1,
      sourceGame1Id: gameIdMap.get("final_four-1") ?? null,
      sourceGame2Id: gameIdMap.get("final_four-2") ?? null,
    });
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
}

export async function syncFromESPNAction(tournamentId: string) {
  await requireAdmin();

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: "Tournament not found." };
  }

  const today = new Date().toISOString().split("T")[0];
  const result = await syncTournament(tournamentId, espnAdapter, today);

  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
  return {
    success: true,
    gamesUpdated: result.gamesUpdated,
    gamesSkipped: result.gamesSkipped,
    teamsUpserted: result.teamsUpserted,
    errors: result.errors,
  };
}

export async function syncStandingsAction(tournamentId: string) {
  await requireAdmin();

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: "Tournament not found." };
  }

  const { updatedCount } = await syncStandingsForTournament(tournamentId);

  revalidatePath(`/admin/tournaments/${tournamentId}/games`);
  return { success: true, updatedCount };
}
