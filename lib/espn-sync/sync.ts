import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  team,
  tournamentTeam,
  tournamentGame,
  tournament,
} from "@/lib/db/schema";
import { syncStandingsForTournament } from "@/lib/db/queries/standings";
import type { SyncGame, SyncResult, TournamentDataSource } from "./types";

// Standard NCAA bracket seeding matchups for R64
// gameNumber -> [higher seed, lower seed]
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

/**
 * Sync ESPN data for a single date into the given tournament.
 */
export async function syncTournament(
  tournamentId: string,
  adapter: TournamentDataSource,
  date: string,
): Promise<SyncResult> {
  const espnGames = await adapter.fetchGamesByDate(date);
  return syncGamesToDB(tournamentId, espnGames);
}

/**
 * Sync ESPN data for a date range into the given tournament.
 * When scheduleOnly is true, only syncs metadata (espnEventId, startTime, venue)
 * without updating scores, status, or winner — useful for pre-populating schedule.
 */
export async function syncTournamentDateRange(
  tournamentId: string,
  adapter: TournamentDataSource,
  startDate: string,
  endDate: string,
  options?: { scheduleOnly?: boolean },
): Promise<SyncResult> {
  const espnGames = await adapter.fetchGamesForDateRange(startDate, endDate);
  return syncGamesToDB(tournamentId, espnGames, options);
}

/**
 * Core sync: match ESPN games to DB games and update.
 */
async function syncGamesToDB(
  tournamentId: string,
  espnGames: SyncGame[],
  options?: { scheduleOnly?: boolean },
): Promise<SyncResult> {
  const scheduleOnly = options?.scheduleOnly ?? false;
  const result: SyncResult = {
    gamesUpdated: 0,
    gamesSkipped: 0,
    teamsUpserted: 0,
    errors: [],
  };

  if (espnGames.length === 0) {
    return result;
  }

  // Load all DB state
  const [dbTeams, dbTournamentTeams, dbGames] = await Promise.all([
    db.select().from(team),
    db
      .select()
      .from(tournamentTeam)
      .where(eq(tournamentTeam.tournamentId, tournamentId)),
    db
      .select()
      .from(tournamentGame)
      .where(eq(tournamentGame.tournamentId, tournamentId)),
  ]);

  // Build lookups
  const teamByEspnId = new Map(
    dbTeams.filter((t) => t.espnId).map((t) => [t.espnId!, t]),
  );
  const ttByTeamId = new Map(dbTournamentTeams.map((tt) => [tt.teamId, tt]));
  const gameByEspnEventId = new Map(
    dbGames.filter((g) => g.espnEventId).map((g) => [g.espnEventId!, g]),
  );

  // Process each ESPN game
  await db.transaction(async (tx) => {
    for (const espnGame of espnGames) {
      try {
        // 1. Upsert teams
        const team1DbId = espnGame.team1
          ? await upsertTeam(tx, espnGame.team1, teamByEspnId)
          : null;
        const team2DbId = espnGame.team2
          ? await upsertTeam(tx, espnGame.team2, teamByEspnId)
          : null;

        if (
          team1DbId &&
          espnGame.team1 &&
          !teamByEspnId.has(espnGame.team1.espnId)
        ) {
          result.teamsUpserted++;
        }
        if (
          team2DbId &&
          espnGame.team2 &&
          !teamByEspnId.has(espnGame.team2.espnId)
        ) {
          result.teamsUpserted++;
        }

        // 2. Upsert tournament teams
        if (team1DbId && espnGame.team1 && espnGame.region) {
          await upsertTournamentTeam(
            tx,
            tournamentId,
            team1DbId,
            espnGame.team1.seed,
            espnGame.region,
            ttByTeamId,
          );
        }
        if (team2DbId && espnGame.team2 && espnGame.region) {
          await upsertTournamentTeam(
            tx,
            tournamentId,
            team2DbId,
            espnGame.team2.seed,
            espnGame.region,
            ttByTeamId,
          );
        }

        // 3. Match ESPN game to DB game
        let dbGame = gameByEspnEventId.get(espnGame.espnEventId);

        if (!dbGame) {
          // Positional match: round + region + gameNumber from seed matchup
          dbGame = findPositionalMatch(dbGames, espnGame);
        }

        if (!dbGame) {
          // Skip First Four games if no DB game exists
          if (espnGame.round === "first_four") {
            result.gamesSkipped++;
            continue;
          }
          result.gamesSkipped++;
          result.errors.push(
            `No DB game match for ESPN event ${espnGame.espnEventId} (${espnGame.round} ${espnGame.region})`,
          );
          continue;
        }

        // 4. Auto-determine winner from scores
        let winnerTeamId: string | null = null;
        if (
          espnGame.status === "final" &&
          espnGame.team1Score !== null &&
          espnGame.team2Score !== null
        ) {
          if (espnGame.winnerEspnTeamId) {
            // Use ESPN's winner designation
            const winnerTeam = teamByEspnId.get(espnGame.winnerEspnTeamId);
            if (winnerTeam) {
              winnerTeamId = winnerTeam.id;
            }
          }
          if (!winnerTeamId) {
            // Fall back to score comparison
            if (espnGame.team1Score > espnGame.team2Score) {
              winnerTeamId = team1DbId;
            } else if (espnGame.team2Score > espnGame.team1Score) {
              winnerTeamId = team2DbId;
            }
          }
        }

        // 5. Update game
        const updateData: Record<string, unknown> = {
          espnEventId: espnGame.espnEventId,
          startTime: espnGame.startTime,
          venueName: espnGame.venue.name,
          venueCity: espnGame.venue.city,
          venueState: espnGame.venue.state,
        };

        if (!scheduleOnly) {
          updateData.status = espnGame.status;
          updateData.statusDetail = espnGame.statusDetail;
          updateData.team1Score = espnGame.team1Score;
          updateData.team2Score = espnGame.team2Score;
          updateData.winnerTeamId = winnerTeamId;
        }

        // Set teams if we have them (skip in scheduleOnly mode — teams
        // are already seeded on R64/FF games and later rounds get teams
        // via winner advancement, not from ESPN data directly)
        if (!scheduleOnly) {
          if (team1DbId) updateData.team1Id = team1DbId;
          if (team2DbId) updateData.team2Id = team2DbId;
        }

        await tx
          .update(tournamentGame)
          .set(updateData)
          .where(eq(tournamentGame.id, dbGame.id));

        // Update local caches so subsequent games can match correctly.
        // The espnEventId map enables direct lookups; updating the dbGame
        // object ensures findPositionalMatch's !g.espnEventId filter
        // excludes already-matched games.
        if (!dbGame.espnEventId) {
          dbGame.espnEventId = espnGame.espnEventId;
          gameByEspnEventId.set(espnGame.espnEventId, dbGame);
        }

        // 6. Advance winner to next round
        if (!scheduleOnly && espnGame.status === "final" && winnerTeamId) {
          const nextGame = dbGames.find(
            (g) =>
              g.sourceGame1Id === dbGame!.id || g.sourceGame2Id === dbGame!.id,
          );

          if (nextGame) {
            const update =
              nextGame.sourceGame1Id === dbGame.id
                ? { team1Id: winnerTeamId }
                : { team2Id: winnerTeamId };

            await tx
              .update(tournamentGame)
              .set(update)
              .where(eq(tournamentGame.id, nextGame.id));
          }
        }

        result.gamesUpdated++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(
          `Error processing ESPN event ${espnGame.espnEventId}: ${message}`,
        );
      }
    }
  });

  // Sync standings after all updates
  try {
    await syncStandingsForTournament(tournamentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    result.errors.push(`Standings sync error: ${message}`);
  }

  return result;
}

async function upsertTeam(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  syncTeam: {
    espnId: string;
    name: string;
    shortName: string;
    abbreviation: string;
    logoUrl: string | null;
  },
  cache: Map<string, typeof team.$inferSelect>,
): Promise<string> {
  const existing = cache.get(syncTeam.espnId);
  if (existing) {
    // Update if name changed
    if (
      existing.name !== syncTeam.name ||
      existing.shortName !== syncTeam.shortName
    ) {
      await tx
        .update(team)
        .set({
          name: syncTeam.name,
          shortName: syncTeam.shortName,
          abbreviation: syncTeam.abbreviation,
          logoUrl: syncTeam.logoUrl,
        })
        .where(eq(team.id, existing.id));
    }
    return existing.id;
  }

  // Insert new team
  const [inserted] = await tx
    .insert(team)
    .values({
      name: syncTeam.name,
      shortName: syncTeam.shortName,
      abbreviation: syncTeam.abbreviation,
      logoUrl: syncTeam.logoUrl,
      espnId: syncTeam.espnId,
    })
    .onConflictDoUpdate({
      target: team.espnId,
      set: {
        name: syncTeam.name,
        shortName: syncTeam.shortName,
        abbreviation: syncTeam.abbreviation,
        logoUrl: syncTeam.logoUrl,
      },
    })
    .returning();

  // Update cache
  cache.set(syncTeam.espnId, inserted);
  return inserted.id;
}

async function upsertTournamentTeam(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  teamId: string,
  seed: number,
  region: "south" | "east" | "west" | "midwest",
  cache: Map<string, typeof tournamentTeam.$inferSelect>,
): Promise<void> {
  if (cache.has(teamId)) return;

  const [inserted] = await tx
    .insert(tournamentTeam)
    .values({ tournamentId, teamId, seed, region })
    .onConflictDoUpdate({
      target: [tournamentTeam.tournamentId, tournamentTeam.teamId],
      set: { seed, region },
    })
    .returning();

  cache.set(teamId, inserted);
}

/**
 * Map a team seed to its R64 game number (1-indexed).
 * E.g. seed 1 or 16 → game 1, seed 8 or 9 → game 2, etc.
 */
function seedToR64GameNumber(seed: number): number | undefined {
  const idx = R64_SEED_MATCHUPS.findIndex(([h, l]) => h === seed || l === seed);
  return idx >= 0 ? idx + 1 : undefined;
}

/**
 * Get all R64 game numbers that feed into a given DB game by tracing
 * source games recursively.
 */
function getR64AncestorGameNumbers(
  game: typeof tournamentGame.$inferSelect,
  gamesById: Map<string, typeof tournamentGame.$inferSelect>,
): Set<number> {
  if (game.round === "round_of_64") {
    return new Set([game.gameNumber]);
  }

  const positions = new Set<number>();
  if (game.sourceGame1Id) {
    const source = gamesById.get(game.sourceGame1Id);
    if (source) {
      for (const pos of getR64AncestorGameNumbers(source, gamesById)) {
        positions.add(pos);
      }
    }
  }
  if (game.sourceGame2Id) {
    const source = gamesById.get(game.sourceGame2Id);
    if (source) {
      for (const pos of getR64AncestorGameNumbers(source, gamesById)) {
        positions.add(pos);
      }
    }
  }
  return positions;
}

/**
 * Match an ESPN game to a DB game by round + region + seed position.
 *
 * For R64, we use the seed matchup to find the exact game number.
 * For R32+, we trace source games back to R64 and check which R64
 * seed positions feed into each candidate, matching by the ESPN
 * game's team seeds.
 */
function findPositionalMatch(
  dbGames: (typeof tournamentGame.$inferSelect)[],
  espnGame: SyncGame,
): typeof tournamentGame.$inferSelect | undefined {
  const gamesById = new Map(dbGames.map((g) => [g.id, g]));

  // For Final Four and Championship, match by tracing source regions
  if (espnGame.round === "final_four" || espnGame.round === "championship") {
    const candidates = dbGames.filter(
      (g) => g.round === espnGame.round && !g.espnEventId,
    );
    if (candidates.length <= 1) return candidates[0];

    // For Final Four: match by checking which regions' E8 games feed each candidate
    if (espnGame.round === "final_four" && espnGame.team1 && espnGame.team2) {
      const team1R64 = seedToR64GameNumber(espnGame.team1.seed);
      const team2R64 = seedToR64GameNumber(espnGame.team2.seed);

      if (team1R64 != null && team2R64 != null) {
        for (const candidate of candidates) {
          const ancestors = getR64AncestorGameNumbers(candidate, gamesById);
          if (ancestors.has(team1R64) && ancestors.has(team2R64)) {
            return candidate;
          }
        }
      }
    }
    return candidates[0];
  }

  if (!espnGame.region) return undefined;

  // For R64, match by seed matchup → exact gameNumber
  if (espnGame.round === "round_of_64" && espnGame.team1 && espnGame.team2) {
    const highSeed = Math.min(espnGame.team1.seed, espnGame.team2.seed);
    const lowSeed = Math.max(espnGame.team1.seed, espnGame.team2.seed);

    const gameNumber = R64_SEED_MATCHUPS.findIndex(
      ([h, l]) => h === highSeed && l === lowSeed,
    );

    if (gameNumber >= 0) {
      return dbGames.find(
        (g) =>
          g.round === "round_of_64" &&
          g.region === espnGame.region &&
          g.gameNumber === gameNumber + 1 &&
          !g.espnEventId,
      );
    }
  }

  // For R32, Sweet 16, Elite 8: use team seeds to match via R64 ancestry
  const candidates = dbGames.filter(
    (g) =>
      g.round === espnGame.round &&
      g.region === espnGame.region &&
      !g.espnEventId,
  );

  if (candidates.length <= 1) return candidates[0];

  // Use team seeds to find which R64 game numbers correspond to each team,
  // then match to the candidate whose source game chain includes both.
  if (espnGame.team1 && espnGame.team2) {
    const team1R64 = seedToR64GameNumber(espnGame.team1.seed);
    const team2R64 = seedToR64GameNumber(espnGame.team2.seed);

    if (team1R64 != null && team2R64 != null) {
      for (const candidate of candidates) {
        const ancestors = getR64AncestorGameNumbers(candidate, gamesById);
        if (ancestors.has(team1R64) && ancestors.has(team2R64)) {
          return candidate;
        }
      }
    }
  }

  // Fallback: return first unmatched candidate
  return candidates[0];
}

/**
 * Get the active tournament ID, or null if none.
 */
export async function getActiveTournamentId(): Promise<string | null> {
  const [active] = await db
    .select({ id: tournament.id })
    .from(tournament)
    .where(eq(tournament.isActive, true));
  return active?.id ?? null;
}
