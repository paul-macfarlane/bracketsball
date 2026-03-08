/**
 * Seeds a 2025 NCAA Tournament with all 68 teams assigned and bracket generated.
 * Requires teams to already be seeded (run seed-teams first).
 * Idempotent: deletes existing tournament for the year before re-creating.
 *
 * Usage: pnpm db:seed:tournament
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { TOURNAMENT_2025_TEAMS } from "./tournament-2025-data";

const REGIONS = ["south", "east", "west", "midwest"] as const;

// Standard NCAA bracket seeding matchups for R64 (higher seed vs lower seed)
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

const TOURNAMENT_YEAR = 2025;
const TOURNAMENT_NAME = "2025 NCAA Tournament";

async function main() {
  // Dynamic imports so env vars are loaded before db connection is created
  const { db } = await import("../lib/db");
  const { team, tournament, tournamentTeam, tournamentGame } =
    await import("../lib/db/tournament-schema");

  await db.transaction(async (tx) => {
    // Idempotent: delete existing tournament for this year (cascade deletes games and teams)
    const [existing] = await tx
      .select()
      .from(tournament)
      .where(eq(tournament.year, TOURNAMENT_YEAR));

    if (existing) {
      console.log(
        `Deleting existing ${TOURNAMENT_YEAR} tournament (${existing.id})...`,
      );
      await tx.delete(tournament).where(eq(tournament.id, existing.id));
    }

    // 1. Create tournament
    console.log(`Creating ${TOURNAMENT_NAME}...`);
    const [t] = await tx
      .insert(tournament)
      .values({
        name: TOURNAMENT_NAME,
        year: TOURNAMENT_YEAR,
        isActive: true,
        bracketTopLeftRegion: "south",
        bracketBottomLeftRegion: "east",
        bracketTopRightRegion: "west",
        bracketBottomRightRegion: "midwest",
      })
      .returning();

    const tournamentId = t.id;
    console.log(`  Created tournament: ${t.name} (${t.id})`);

    // Deactivate other tournaments
    await tx
      .update(tournament)
      .set({ isActive: false })
      .where(eq(tournament.isActive, true));
    await tx
      .update(tournament)
      .set({ isActive: true })
      .where(eq(tournament.id, tournamentId));

    // Helper to look up team by espnId within the transaction
    async function findTeamByEspnId(espnId: string) {
      const [result] = await tx
        .select()
        .from(team)
        .where(eq(team.espnId, espnId));
      return result ?? null;
    }

    // 2. Assign teams to tournament
    console.log("\nAssigning teams to tournament...");
    for (const entry of TOURNAMENT_2025_TEAMS) {
      const dbTeam = await findTeamByEspnId(entry.espnId);

      if (!dbTeam) {
        console.error(
          `  ! Team not found: ${entry.name} (ESPN ID: ${entry.espnId})`,
        );
        continue;
      }

      await tx.insert(tournamentTeam).values({
        tournamentId,
        teamId: dbTeam.id,
        seed: entry.seed,
        region: entry.region,
      });

      console.log(
        `  + (${entry.region.toUpperCase()}) #${entry.seed} ${entry.name}`,
      );
    }

    // 3. Create First Four games
    console.log("\nCreating First Four games...");
    const firstFourPairs = [
      { region: "south" as const, seed: 11, espnIds: ["153", "21"] },
      { region: "south" as const, seed: 16, espnIds: ["2011", "2598"] },
      { region: "east" as const, seed: 16, espnIds: ["116", "44"] },
      { region: "midwest" as const, seed: 11, espnIds: ["2752", "251"] },
    ];

    const firstFourGameIds = new Map<string, string>();

    for (let i = 0; i < firstFourPairs.length; i++) {
      const pair = firstFourPairs[i];
      const team1 = await findTeamByEspnId(pair.espnIds[0]);
      const team2 = await findTeamByEspnId(pair.espnIds[1]);

      const [game] = await tx
        .insert(tournamentGame)
        .values({
          tournamentId,
          round: "first_four",
          region: pair.region,
          gameNumber: i + 1,
          team1Id: team1?.id ?? null,
          team2Id: team2?.id ?? null,
          status: "scheduled",
        })
        .returning();

      firstFourGameIds.set(`${pair.region}-${pair.seed}`, game.id);
      console.log(
        `  + First Four #${i + 1}: ${team1?.name ?? "TBD"} vs ${team2?.name ?? "TBD"} (${pair.region} ${pair.seed}-seed)`,
      );
    }

    // 4. Create R64 games (8 per region = 32 total)
    console.log("\nCreating Round of 64 games...");
    const gameIdMap = new Map<string, string>();

    for (const region of REGIONS) {
      const regionTeams = TOURNAMENT_2025_TEAMS.filter(
        (t) => t.region === region,
      );

      const firstFourSeeds = new Set<number>();
      for (const [key] of firstFourGameIds) {
        const [r, s] = key.split("-");
        if (r === region) firstFourSeeds.add(parseInt(s));
      }

      for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
        const [highSeed, lowSeed] = R64_SEED_MATCHUPS[i];
        const gameNumber = i + 1;

        let team1Id: string | null = null;
        let team2Id: string | null = null;
        let sourceGame1Id: string | null = null;
        let sourceGame2Id: string | null = null;

        if (firstFourSeeds.has(highSeed)) {
          sourceGame1Id = firstFourGameIds.get(`${region}-${highSeed}`) ?? null;
        } else {
          const t = regionTeams.find((t) => t.seed === highSeed);
          if (t) {
            const dbTeam = await findTeamByEspnId(t.espnId);
            team1Id = dbTeam?.id ?? null;
          }
        }

        if (firstFourSeeds.has(lowSeed)) {
          sourceGame2Id = firstFourGameIds.get(`${region}-${lowSeed}`) ?? null;
        } else {
          const t = regionTeams.find((t) => t.seed === lowSeed);
          if (t) {
            const dbTeam = await findTeamByEspnId(t.espnId);
            team2Id = dbTeam?.id ?? null;
          }
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

      console.log(`  + ${region.toUpperCase()}: 8 games`);
    }

    // 5. Create Round of 32 (4 per region = 16 total)
    console.log("Creating Round of 32 games...");
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

      console.log(`  + ${region.toUpperCase()}: 4 games`);
    }

    // 6. Create Sweet 16 (2 per region = 8 total)
    console.log("Creating Sweet 16 games...");
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
    console.log("  + 8 games");

    // 7. Create Elite 8 (1 per region = 4 total)
    console.log("Creating Elite 8 games...");
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
    console.log("  + 4 games");

    // 8. Create Final Four (2 games based on bracket positions)
    // Left side regions play each other, right side regions play each other
    console.log("Creating Final Four games...");
    const [ff1] = await tx
      .insert(tournamentGame)
      .values({
        tournamentId,
        round: "final_four",
        gameNumber: 1,
        sourceGame1Id:
          gameIdMap.get(`${t.bracketTopLeftRegion}-elite_8-1`) ?? null,
        sourceGame2Id:
          gameIdMap.get(`${t.bracketBottomLeftRegion}-elite_8-1`) ?? null,
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
        sourceGame1Id:
          gameIdMap.get(`${t.bracketTopRightRegion}-elite_8-1`) ?? null,
        sourceGame2Id:
          gameIdMap.get(`${t.bracketBottomRightRegion}-elite_8-1`) ?? null,
        status: "scheduled",
      })
      .returning();
    gameIdMap.set("final_four-2", ff2.id);
    console.log("  + 2 games");

    // 9. Create Championship (1 game)
    console.log("Creating Championship game...");
    await tx.insert(tournamentGame).values({
      tournamentId,
      round: "championship",
      gameNumber: 1,
      sourceGame1Id: gameIdMap.get("final_four-1") ?? null,
      sourceGame2Id: gameIdMap.get("final_four-2") ?? null,
      status: "scheduled",
    });
    console.log("  + 1 game");

    const totalGames =
      firstFourPairs.length + // 4 First Four
      32 + // R64
      16 + // R32
      8 + // Sweet 16
      4 + // Elite 8
      2 + // Final Four
      1; // Championship

    console.log(`\nDone! Created ${totalGames} total games.`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
