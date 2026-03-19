/**
 * One-off cleanup script to clear incorrectly matched ESPN data on R32+ games.
 *
 * The old sync fallback (`candidates[0]`) could assign the wrong espnEventId,
 * venue, and startTime to games when teams weren't yet known. This script
 * nulls out those fields on non-final R32+ games so the next full sync
 * re-matches them correctly using team-based positional matching.
 *
 * Safe to run: only touches espnEventId, venue, startTime, and statusDetail.
 * Does NOT touch picks, teams, scores, or winners.
 *
 * Usage:
 *   npx tsx scripts/cleanup-espn-matches.ts              # dry run (default)
 *   npx tsx scripts/cleanup-espn-matches.ts --execute     # actually clear the data
 *
 * After running with --execute, trigger a full sync:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/sync-espn-full
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const ROUNDS_TO_CLEAN = [
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
] as const;

async function main() {
  const dryRun = !process.argv.includes("--execute");

  // Dynamic imports so dotenv loads DATABASE_URL before db module initializes
  const { and, eq, inArray, isNotNull } = await import("drizzle-orm");
  const { db } = await import("../lib/db");
  const { tournamentGame, tournament } = await import("../lib/db/schema");

  if (dryRun) {
    console.log("🔍 DRY RUN — pass --execute to actually clear data\n");
  }

  // Find active tournament
  const [activeTournament] = await db
    .select({ id: tournament.id, name: tournament.name })
    .from(tournament)
    .where(eq(tournament.isActive, true));

  if (!activeTournament) {
    console.error("No active tournament found");
    process.exit(1);
  }

  console.log(
    `Tournament: ${activeTournament.name} (${activeTournament.id})\n`,
  );

  // Find R32+ games that have an espnEventId and are not final
  const gamesToClean = await db
    .select({
      id: tournamentGame.id,
      round: tournamentGame.round,
      region: tournamentGame.region,
      gameNumber: tournamentGame.gameNumber,
      espnEventId: tournamentGame.espnEventId,
      venueName: tournamentGame.venueName,
      venueCity: tournamentGame.venueCity,
      venueState: tournamentGame.venueState,
      startTime: tournamentGame.startTime,
      status: tournamentGame.status,
      winnerTeamId: tournamentGame.winnerTeamId,
    })
    .from(tournamentGame)
    .where(
      and(
        eq(tournamentGame.tournamentId, activeTournament.id),
        inArray(tournamentGame.round, [...ROUNDS_TO_CLEAN]),
        isNotNull(tournamentGame.espnEventId),
      ),
    );

  // Only clean games that aren't final (don't touch completed games)
  const nonFinalGames = gamesToClean.filter((g) => g.status !== "final");

  if (nonFinalGames.length === 0) {
    console.log(
      "No non-final R32+ games with espnEventId found. Nothing to clean.",
    );
    process.exit(0);
  }

  console.log(`Found ${nonFinalGames.length} non-final R32+ games to clean:\n`);

  for (const game of nonFinalGames) {
    const venue = [game.venueName, game.venueCity, game.venueState]
      .filter(Boolean)
      .join(", ");
    console.log(
      `  ${game.round} | ${game.region ?? "—"} | game ${game.gameNumber} | ` +
        `espn: ${game.espnEventId} | venue: ${venue || "none"} | ` +
        `time: ${game.startTime?.toISOString() ?? "none"}`,
    );
  }

  if (dryRun) {
    console.log("\n🔍 DRY RUN — no changes made. Pass --execute to clear.");
    process.exit(0);
  }

  // Clear the fields
  const gameIds = nonFinalGames.map((g) => g.id);

  await db
    .update(tournamentGame)
    .set({
      espnEventId: null,
      venueName: null,
      venueCity: null,
      venueState: null,
      startTime: null,
      statusDetail: null,
    })
    .where(inArray(tournamentGame.id, gameIds));

  console.log(
    `\n✅ Cleared espnEventId, venue, startTime, and statusDetail on ${gameIds.length} games.`,
  );
  console.log(
    "\nNext step: run a full sync to re-match these games correctly:",
  );
  console.log(
    '  curl -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/sync-espn-full',
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
