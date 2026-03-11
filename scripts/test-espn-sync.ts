/**
 * ESPN sync test/simulation script.
 *
 * Creates a tournament from ESPN data, generates the bracket, and syncs games.
 * Supports progressive mode to simulate how the sync works round-by-round.
 *
 * Usage:
 *   pnpm sync:test 2024                  # Sync all at once
 *   pnpm sync:test 2024 --progressive    # Sync phase by phase, pause between rounds
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import * as readline from "readline";

interface TournamentPhase {
  name: string;
  start: string;
  end: string;
}

interface YearConfig {
  phases: TournamentPhase[];
  positions: {
    topLeft: "south" | "east" | "west" | "midwest";
    bottomLeft: "south" | "east" | "west" | "midwest";
    topRight: "south" | "east" | "west" | "midwest";
    bottomRight: "south" | "east" | "west" | "midwest";
  };
}

const YEAR_CONFIGS: Record<number, YearConfig> = {
  2023: {
    phases: [
      { name: "First Four", start: "2023-03-14", end: "2023-03-15" },
      { name: "Round of 64", start: "2023-03-16", end: "2023-03-17" },
      { name: "Round of 32", start: "2023-03-18", end: "2023-03-19" },
      { name: "Sweet 16", start: "2023-03-23", end: "2023-03-24" },
      { name: "Elite 8", start: "2023-03-25", end: "2023-03-26" },
      { name: "Final Four", start: "2023-04-01", end: "2023-04-01" },
      { name: "Championship", start: "2023-04-03", end: "2023-04-03" },
    ],
    positions: {
      topLeft: "south",
      bottomLeft: "east",
      topRight: "midwest",
      bottomRight: "west",
    },
  },
  2024: {
    phases: [
      { name: "First Four", start: "2024-03-19", end: "2024-03-20" },
      { name: "Round of 64", start: "2024-03-21", end: "2024-03-22" },
      { name: "Round of 32", start: "2024-03-23", end: "2024-03-24" },
      { name: "Sweet 16", start: "2024-03-28", end: "2024-03-29" },
      { name: "Elite 8", start: "2024-03-30", end: "2024-03-31" },
      { name: "Final Four", start: "2024-04-06", end: "2024-04-06" },
      { name: "Championship", start: "2024-04-08", end: "2024-04-08" },
    ],
    positions: {
      topLeft: "south",
      bottomLeft: "east",
      topRight: "midwest",
      bottomRight: "west",
    },
  },
  2025: {
    phases: [
      { name: "First Four", start: "2025-03-18", end: "2025-03-19" },
      { name: "Round of 64", start: "2025-03-20", end: "2025-03-21" },
      { name: "Round of 32", start: "2025-03-22", end: "2025-03-23" },
      { name: "Sweet 16", start: "2025-03-27", end: "2025-03-28" },
      { name: "Elite 8", start: "2025-03-29", end: "2025-03-30" },
      { name: "Final Four", start: "2025-04-05", end: "2025-04-05" },
      { name: "Championship", start: "2025-04-07", end: "2025-04-07" },
    ],
    positions: {
      topLeft: "south",
      bottomLeft: "east",
      topRight: "west",
      bottomRight: "midwest",
    },
  },
  // Official 2026 schedule: https://www.ncaa.com/news/basketball-men/article/2025-06-12/2026-march-madness-mens-ncaa-tournament-schedule-dates
  // Selection Sunday: March 15. Final Four & Championship at Lucas Oil Stadium, Indianapolis.
  // Bracket positions (TL/BL/TR/BR) determine which regions' Elite 8
  // winners meet in each Final Four game — announced on Selection Sunday.
  2026: {
    phases: [
      { name: "First Four", start: "2026-03-17", end: "2026-03-18" },
      { name: "Round of 64", start: "2026-03-19", end: "2026-03-20" },
      { name: "Round of 32", start: "2026-03-21", end: "2026-03-22" },
      { name: "Sweet 16", start: "2026-03-26", end: "2026-03-27" },
      { name: "Elite 8", start: "2026-03-28", end: "2026-03-29" },
      { name: "Final Four", start: "2026-04-04", end: "2026-04-04" },
      { name: "Championship", start: "2026-04-06", end: "2026-04-06" },
    ],
    positions: {
      topLeft: "south", // TODO: Update after Selection Sunday (March 15)
      bottomLeft: "east", // TODO: Update after Selection Sunday (March 15)
      topRight: "west", // TODO: Update after Selection Sunday (March 15)
      bottomRight: "midwest", // TODO: Update after Selection Sunday (March 15)
    },
  },
};

const ROUND_ORDER = [
  "first_four",
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
] as const;

const ROUND_NAMES: Record<string, string> = {
  first_four: "First Four",
  round_of_64: "Round of 64",
  round_of_32: "Round of 32",
  sweet_16: "Sweet 16",
  elite_8: "Elite 8",
  final_four: "Final Four",
  championship: "Championship",
};

/**
 * Waits for user input. Returns "exit" if the user types "exit" or "q",
 * otherwise returns "continue".
 */
function waitForInput(prompt: string): Promise<"continue" | "exit"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = answer.trim().toLowerCase();
      if (trimmed === "exit" || trimmed === "q" || trimmed === "quit") {
        resolve("exit");
      } else {
        resolve("continue");
      }
    });
  });
}

async function main() {
  const year = parseInt(process.argv[2], 10);
  const progressive = process.argv.includes("--progressive");
  const yearConfig = year ? YEAR_CONFIGS[year] : undefined;

  if (!year || !yearConfig) {
    console.error(
      `Usage: pnpm sync:test <year> [--progressive]\nSupported years: ${Object.keys(YEAR_CONFIGS).join(", ")}`,
    );
    process.exit(1);
  }

  const { phases, positions } = yearConfig;
  const fullStart = phases[0].start;
  const fullEnd = phases[phases.length - 1].end;

  console.log(`\n=== ESPN Sync Test: ${year} NCAA Tournament ===`);
  console.log(
    `Mode: ${progressive ? "Progressive (phase by phase)" : "Full sync"}`,
  );
  console.log(`Date range: ${fullStart} to ${fullEnd}\n`);

  // Dynamic imports so env vars are loaded first
  const { db } = await import("../lib/db");
  const { team, tournament, tournamentTeam, tournamentGame } =
    await import("../lib/db/tournament-schema");
  const { espnAdapter } = await import("../lib/espn-sync/espn-adapter");
  const { syncTournamentDateRange } = await import("../lib/espn-sync/sync");

  // Validation helper — uses closure to capture db/schema
  async function printValidation(tournamentId: string) {
    const games = await db
      .select()
      .from(tournamentGame)
      .where(eq(tournamentGame.tournamentId, tournamentId));

    const withEspnId = games.filter((g) => g.espnEventId);
    const finalStatus = games.filter((g) => g.status === "final");
    const withWinner = games.filter((g) => g.winnerTeamId);
    const championship = games.find((g) => g.round === "championship");

    console.log(`\n  DB State:`);
    console.log(`    Total games: ${games.length}`);
    console.log(
      `    ESPN matched: ${withEspnId.length} | Final: ${finalStatus.length} | With winner: ${withWinner.length}`,
    );

    console.log("");
    for (const round of ROUND_ORDER) {
      const roundGames = games.filter((g) => g.round === round);
      if (roundGames.length === 0) continue;
      const matched = roundGames.filter((g) => g.espnEventId).length;
      const fin = roundGames.filter((g) => g.status === "final").length;
      const winners = roundGames.filter((g) => g.winnerTeamId).length;
      const withTeams = roundGames.filter((g) => g.team1Id && g.team2Id).length;

      console.log(
        `    ${ROUND_NAMES[round].padEnd(15)} | ${roundGames.length} games | ${withTeams} have teams | ${matched} ESPN | ${fin} final | ${winners} winners`,
      );
    }

    if (championship?.winnerTeamId) {
      const [champTeam] = await db
        .select()
        .from(team)
        .where(eq(team.id, championship.winnerTeamId));
      console.log(`\n    Champion: ${champTeam?.name ?? "Unknown"}`);
    }

    return { games, withEspnId, finalStatus, championship };
  }

  // --- Step 1: Fetch all ESPN data to discover teams ---
  console.log("[1/6] Fetching ESPN data to discover teams...");
  const allEspnGames = await espnAdapter.fetchGamesForDateRange(
    fullStart,
    fullEnd,
  );
  console.log(`  Found ${allEspnGames.length} tournament games from ESPN`);

  const teamsByRegion = new Map<
    string,
    Map<number, { espnId: string; name: string }>
  >();
  for (const game of allEspnGames) {
    if (!game.region) continue;
    if (!teamsByRegion.has(game.region))
      teamsByRegion.set(game.region, new Map());
    const regionMap = teamsByRegion.get(game.region)!;
    if (game.team1)
      regionMap.set(game.team1.seed, {
        espnId: game.team1.espnId,
        name: game.team1.name,
      });
    if (game.team2)
      regionMap.set(game.team2.seed, {
        espnId: game.team2.espnId,
        name: game.team2.name,
      });
  }

  console.log("  Teams by region:");
  for (const [region, teams] of teamsByRegion) {
    console.log(`    ${region}: ${teams.size} teams`);
  }

  // --- Step 2: Create tournament + seed teams ---
  console.log("\n[2/6] Setting up tournament...");
  const [existing] = await db
    .select()
    .from(tournament)
    .where(eq(tournament.year, year));

  if (existing) {
    console.log(`  Deleting existing ${year} tournament...`);
    await db.delete(tournament).where(eq(tournament.id, existing.id));
  }

  const [t] = await db
    .insert(tournament)
    .values({
      name: `${year} NCAA Tournament`,
      year,
      isActive: false,
      bracketTopLeftRegion: positions.topLeft,
      bracketBottomLeftRegion: positions.bottomLeft,
      bracketTopRightRegion: positions.topRight,
      bracketBottomRightRegion: positions.bottomRight,
    })
    .returning();
  const tournamentId = t.id;
  console.log(`  Created tournament: ${t.name} (${t.id})`);

  // Upsert teams
  const allTeams = new Map<
    string,
    { name: string; shortName: string; abbreviation: string; espnId: string }
  >();
  for (const game of allEspnGames) {
    for (const syncTeam of [game.team1, game.team2]) {
      if (syncTeam && !allTeams.has(syncTeam.espnId)) {
        allTeams.set(syncTeam.espnId, {
          name: syncTeam.name,
          shortName: syncTeam.shortName,
          abbreviation: syncTeam.abbreviation,
          espnId: syncTeam.espnId,
        });
      }
    }
  }

  console.log(`  Upserting ${allTeams.size} teams...`);
  for (const tm of allTeams.values()) {
    const logoUrl = `https://a.espncdn.com/i/teamlogos/ncaa/500/${tm.espnId}.png`;
    await db
      .insert(team)
      .values({
        name: tm.name,
        shortName: tm.shortName,
        abbreviation: tm.abbreviation,
        logoUrl,
        espnId: tm.espnId,
      })
      .onConflictDoUpdate({
        target: team.espnId,
        set: {
          name: tm.name,
          shortName: tm.shortName,
          abbreviation: tm.abbreviation,
          logoUrl,
        },
      });
  }

  // Assign tournament teams from First Four + R64 games
  const dbTeams = await db.select().from(team);
  const teamByEspnId = new Map(
    dbTeams.filter((tm) => tm.espnId).map((tm) => [tm.espnId!, tm]),
  );

  const assignedTeams = new Set<string>();
  for (const game of allEspnGames) {
    if (!game.region) continue;
    if (game.round !== "round_of_64" && game.round !== "first_four") continue;
    for (const syncTeam of [game.team1, game.team2]) {
      if (!syncTeam) continue;
      const dbTeam = teamByEspnId.get(syncTeam.espnId);
      if (!dbTeam || assignedTeams.has(dbTeam.id)) continue;
      await db
        .insert(tournamentTeam)
        .values({
          tournamentId,
          teamId: dbTeam.id,
          seed: syncTeam.seed,
          region: game.region,
        })
        .onConflictDoUpdate({
          target: [tournamentTeam.tournamentId, tournamentTeam.teamId],
          set: { seed: syncTeam.seed, region: game.region },
        });
      assignedTeams.add(dbTeam.id);
    }
  }
  console.log(`  Assigned ${assignedTeams.size} tournament teams`);

  // --- Step 3: Generate bracket ---
  console.log("\n[3/6] Generating bracket structure...");

  const REGIONS = ["south", "east", "west", "midwest"] as const;
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

  const tTeams = await db
    .select()
    .from(tournamentTeam)
    .where(eq(tournamentTeam.tournamentId, tournamentId));

  const teamLookup = new Map<string, Map<number, string>>();
  for (const tt of tTeams) {
    if (!teamLookup.has(tt.region)) teamLookup.set(tt.region, new Map());
    teamLookup.get(tt.region)!.set(tt.seed, tt.teamId);
  }

  const firstFourSeeds = new Map<string, Set<number>>();
  for (const tt of tTeams) {
    if (!firstFourSeeds.has(tt.region))
      firstFourSeeds.set(tt.region, new Set());
    const count = tTeams.filter(
      (tm) => tm.region === tt.region && tm.seed === tt.seed,
    ).length;
    if (count > 1) firstFourSeeds.get(tt.region)!.add(tt.seed);
  }

  await db.transaction(async (tx) => {
    const gameIdMap = new Map<string, string>();
    const firstFourGameIds = new Map<string, string>();

    // First Four
    const firstFourPairs: {
      region: (typeof REGIONS)[number];
      seed: number;
      teamIds: string[];
    }[] = [];
    for (const [region, seeds] of firstFourSeeds) {
      for (const seed of seeds) {
        const teams = tTeams.filter(
          (tm) => tm.region === region && tm.seed === seed,
        );
        if (teams.length === 2) {
          firstFourPairs.push({
            region: region as (typeof REGIONS)[number],
            seed,
            teamIds: [teams[0].teamId, teams[1].teamId],
          });
        }
      }
    }

    for (let i = 0; i < firstFourPairs.length; i++) {
      const pair = firstFourPairs[i];
      const [game] = await tx
        .insert(tournamentGame)
        .values({
          tournamentId,
          round: "first_four",
          region: pair.region,
          gameNumber: i + 1,
          team1Id: pair.teamIds[0],
          team2Id: pair.teamIds[1],
          status: "scheduled",
        })
        .returning();
      firstFourGameIds.set(`${pair.region}-${pair.seed}`, game.id);
    }
    console.log(`  Created ${firstFourPairs.length} First Four games`);

    // R64
    for (const region of REGIONS) {
      const seeds = teamLookup.get(region);
      if (!seeds) continue;
      const ffSeeds = firstFourSeeds.get(region) ?? new Set();
      for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
        const [highSeed, lowSeed] = R64_SEED_MATCHUPS[i];
        const gameNumber = i + 1;
        let team1Id: string | null = null;
        let team2Id: string | null = null;
        let sourceGame1Id: string | null = null;
        let sourceGame2Id: string | null = null;

        if (ffSeeds.has(highSeed)) {
          sourceGame1Id = firstFourGameIds.get(`${region}-${highSeed}`) ?? null;
        } else {
          team1Id = seeds.get(highSeed) ?? null;
        }
        if (ffSeeds.has(lowSeed)) {
          sourceGame2Id = firstFourGameIds.get(`${region}-${lowSeed}`) ?? null;
        } else {
          team2Id = seeds.get(lowSeed) ?? null;
        }

        const [game] = await tx
          .insert(tournamentGame)
          .values({
            tournamentId,
            round: "round_of_64",
            region,
            gameNumber,
            team1Id,
            team2Id,
            sourceGame1Id,
            sourceGame2Id,
            status: "scheduled",
          })
          .returning();
        gameIdMap.set(`${region}-round_of_64-${gameNumber}`, game.id);
      }
    }
    console.log("  Created 32 Round of 64 games");

    // R32
    for (const region of REGIONS) {
      for (let i = 0; i < 4; i++) {
        const gameNumber = i + 1;
        const [game] = await tx
          .insert(tournamentGame)
          .values({
            tournamentId,
            round: "round_of_32",
            region,
            gameNumber,
            sourceGame1Id:
              gameIdMap.get(`${region}-round_of_64-${i * 2 + 1}`) ?? null,
            sourceGame2Id:
              gameIdMap.get(`${region}-round_of_64-${i * 2 + 2}`) ?? null,
            status: "scheduled",
          })
          .returning();
        gameIdMap.set(`${region}-round_of_32-${gameNumber}`, game.id);
      }
    }
    console.log("  Created 16 Round of 32 games");

    // S16
    for (const region of REGIONS) {
      for (let i = 0; i < 2; i++) {
        const gameNumber = i + 1;
        const [game] = await tx
          .insert(tournamentGame)
          .values({
            tournamentId,
            round: "sweet_16",
            region,
            gameNumber,
            sourceGame1Id:
              gameIdMap.get(`${region}-round_of_32-${i * 2 + 1}`) ?? null,
            sourceGame2Id:
              gameIdMap.get(`${region}-round_of_32-${i * 2 + 2}`) ?? null,
            status: "scheduled",
          })
          .returning();
        gameIdMap.set(`${region}-sweet_16-${gameNumber}`, game.id);
      }
    }
    console.log("  Created 8 Sweet 16 games");

    // E8
    for (const region of REGIONS) {
      const [game] = await tx
        .insert(tournamentGame)
        .values({
          tournamentId,
          round: "elite_8",
          region,
          gameNumber: 1,
          sourceGame1Id: gameIdMap.get(`${region}-sweet_16-1`) ?? null,
          sourceGame2Id: gameIdMap.get(`${region}-sweet_16-2`) ?? null,
          status: "scheduled",
        })
        .returning();
      gameIdMap.set(`${region}-elite_8-1`, game.id);
    }
    console.log("  Created 4 Elite 8 games");

    // Final Four
    const [ff1] = await tx
      .insert(tournamentGame)
      .values({
        tournamentId,
        round: "final_four",
        gameNumber: 1,
        sourceGame1Id: gameIdMap.get(`${positions.topLeft}-elite_8-1`) ?? null,
        sourceGame2Id:
          gameIdMap.get(`${positions.bottomLeft}-elite_8-1`) ?? null,
        status: "scheduled",
      })
      .returning();
    gameIdMap.set("final_four-1", ff1.id);

    const [ff2] = await tx
      .insert(tournamentGame)
      .values({
        tournamentId,
        round: "final_four",
        gameNumber: 2,
        sourceGame1Id: gameIdMap.get(`${positions.topRight}-elite_8-1`) ?? null,
        sourceGame2Id:
          gameIdMap.get(`${positions.bottomRight}-elite_8-1`) ?? null,
        status: "scheduled",
      })
      .returning();
    gameIdMap.set("final_four-2", ff2.id);
    console.log("  Created 2 Final Four games");

    // Championship
    await tx.insert(tournamentGame).values({
      tournamentId,
      round: "championship",
      gameNumber: 1,
      sourceGame1Id: gameIdMap.get("final_four-1") ?? null,
      sourceGame2Id: gameIdMap.get("final_four-2") ?? null,
      status: "scheduled",
    });
    console.log("  Created 1 Championship game");
  });

  // --- Step 4: Initial game schedule sync (populate times, venues, ESPN IDs for all games) ---
  console.log(
    "\n[4/6] Syncing game schedule from ESPN (times, venues, ESPN IDs)...",
  );
  const initialSyncResult = await syncTournamentDateRange(
    tournamentId,
    espnAdapter,
    fullStart,
    fullEnd,
    { scheduleOnly: true },
  );
  console.log(
    `  Games updated: ${initialSyncResult.gamesUpdated} | Skipped: ${initialSyncResult.gamesSkipped} | Teams upserted: ${initialSyncResult.teamsUpserted}`,
  );
  if (initialSyncResult.errors.length > 0) {
    console.log(`  Errors (${initialSyncResult.errors.length}):`);
    for (const err of initialSyncResult.errors.slice(0, 5)) {
      console.log(`    - ${err}`);
    }
  }

  // Validate schedule data populated
  const scheduleGames = await db
    .select()
    .from(tournamentGame)
    .where(eq(tournamentGame.tournamentId, tournamentId));
  const withStartTime = scheduleGames.filter((g) => g.startTime !== null);
  const withVenue = scheduleGames.filter((g) => g.venueName !== null);
  const withEspnEventId = scheduleGames.filter((g) => g.espnEventId !== null);
  console.log(`\n  Schedule Validation:`);
  console.log(
    `    Games with start time: ${withStartTime.length}/${scheduleGames.length}`,
  );
  console.log(
    `    Games with venue: ${withVenue.length}/${scheduleGames.length}`,
  );
  console.log(
    `    Games with ESPN event ID: ${withEspnEventId.length}/${scheduleGames.length}`,
  );

  // --- Step 5: Sync team stats ---
  console.log("\n[5/6] Syncing team stats from ESPN...");
  const { syncTeamStats } = await import("../lib/espn-sync/sync-team-stats");

  const statsResult = await syncTeamStats(tournamentId, (completed, total) => {
    if (completed % 10 === 0 || completed === total) {
      console.log(`  Stats progress: ${completed}/${total} teams`);
    }
  });

  console.log(
    `  Teams updated: ${statsResult.teamsUpdated} | Skipped: ${statsResult.teamsSkipped}`,
  );
  if (statsResult.errors.length > 0) {
    console.log(`  Errors (${statsResult.errors.length}):`);
    for (const err of statsResult.errors.slice(0, 5)) {
      console.log(`    - ${err}`);
    }
  }

  // Validate team stats
  const tTeamsWithStats = await db
    .select()
    .from(tournamentTeam)
    .where(eq(tournamentTeam.tournamentId, tournamentId));

  const withStats = tTeamsWithStats.filter((tt) => tt.ppg !== null);
  const withRecord = tTeamsWithStats.filter((tt) => tt.overallWins !== null);
  const withApRank = tTeamsWithStats.filter((tt) => tt.apRanking !== null);

  console.log(`\n  Team Stats Validation:`);
  console.log(
    `    Teams with stats: ${withStats.length}/${tTeamsWithStats.length}`,
  );
  console.log(
    `    Teams with record: ${withRecord.length}/${tTeamsWithStats.length}`,
  );
  console.log(
    `    Teams with AP ranking: ${withApRank.length}/${tTeamsWithStats.length}`,
  );

  // Print a few sample stats
  const sampleTeams = tTeamsWithStats
    .filter((tt) => tt.ppg !== null)
    .slice(0, 3);
  if (sampleTeams.length > 0) {
    console.log(`\n  Sample team stats:`);
    for (const tt of sampleTeams) {
      const dbTeam = dbTeams.find((t) => t.id === tt.teamId);
      console.log(
        `    ${dbTeam?.name ?? "Unknown"}: ${tt.overallWins}-${tt.overallLosses} (${tt.conferenceName ?? "?"}) | PPG: ${tt.ppg?.toFixed(1)} | Opp PPG: ${tt.oppPpg?.toFixed(1)} | FG%: ${tt.fgPct?.toFixed(1)} | 3PT%: ${tt.threePtPct?.toFixed(1)}${tt.apRanking ? ` | AP #${tt.apRanking}` : ""}`,
      );
    }
  }

  // --- Step 6: Sync game results ---
  if (progressive) {
    console.log("\n[6/6] Running progressive sync (phase by phase)...");
    console.log(
      '       Press Enter after each phase to continue, or type "exit" to stop.\n',
    );

    await printValidation(tournamentId);
    const startAction = await waitForInput(
      "\n  Press Enter to start syncing First Four (or 'exit' to stop)... ",
    );
    if (startAction === "exit") {
      console.log("\n  Exiting early. Tournament data persisted.");
      process.exit(0);
    }

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      console.log(
        `\n--- Phase ${i + 1}/${phases.length}: ${phase.name} (${phase.start} to ${phase.end}) ---`,
      );

      const result = await syncTournamentDateRange(
        tournamentId,
        espnAdapter,
        phase.start,
        phase.end,
      );

      console.log(
        `  Games updated: ${result.gamesUpdated} | Skipped: ${result.gamesSkipped} | Teams upserted: ${result.teamsUpserted}`,
      );
      if (result.errors.length > 0) {
        console.log(`  Errors (${result.errors.length}):`);
        for (const err of result.errors.slice(0, 5)) {
          console.log(`    - ${err}`);
        }
        if (result.errors.length > 5)
          console.log(`    ... and ${result.errors.length - 5} more`);
      }

      await printValidation(tournamentId);

      if (i < phases.length - 1) {
        const action = await waitForInput(
          `\n  Press Enter to sync ${phases[i + 1].name} (or 'exit' to stop)... `,
        );
        if (action === "exit") {
          console.log("\n  Exiting early. Tournament data persisted.");
          process.exit(0);
        }
      }
    }
  } else {
    console.log("\n[6/6] Running full sync (updating scores/results)...");
    const syncResult = await syncTournamentDateRange(
      tournamentId,
      espnAdapter,
      fullStart,
      fullEnd,
    );
    console.log(`  Games updated: ${syncResult.gamesUpdated}`);
    console.log(`  Games skipped: ${syncResult.gamesSkipped}`);
    console.log(`  Teams upserted: ${syncResult.teamsUpserted}`);
    if (syncResult.errors.length > 0) {
      console.log(`  Errors (${syncResult.errors.length}):`);
      for (const err of syncResult.errors) {
        console.log(`    - ${err}`);
      }
    }
  }

  // Final validation
  console.log("\n=== Final Validation ===");
  const { withEspnId, finalStatus, championship } =
    await printValidation(tournamentId);

  const issues: string[] = [];
  if (withEspnId.length < 63) {
    issues.push(
      `Only ${withEspnId.length} games have ESPN IDs (expected at least 63)`,
    );
  }
  if (finalStatus.length < 63) {
    issues.push(
      `Only ${finalStatus.length} games marked final (expected at least 63 for completed tournament)`,
    );
  }
  if (!championship?.winnerTeamId) {
    issues.push("Championship has no winner");
  }

  if (issues.length > 0) {
    console.log("\n  Issues found:");
    for (const issue of issues) {
      console.log(`    - ${issue}`);
    }
  } else {
    console.log("\n  All validations passed!");
  }

  console.log(
    `\nTournament "${t.name}" (${tournamentId}) persisted in database.`,
  );
  console.log("Delete manually via admin UI or re-run this script to replace.");

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
