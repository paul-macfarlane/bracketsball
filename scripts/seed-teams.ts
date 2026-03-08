/**
 * Seeds the database with 68 real NCAA teams from the 2025 tournament.
 * Idempotent: uses onConflictDoUpdate on espnId to upsert teams.
 *
 * Usage: pnpm db:seed:teams
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { TOURNAMENT_2025_TEAMS } from "./tournament-2025-data";

async function main() {
  // Dynamic import so env vars are loaded before db connection is created
  const { db } = await import("../lib/db");
  const { team } = await import("../lib/db/tournament-schema");

  console.log(
    `Seeding ${TOURNAMENT_2025_TEAMS.length} teams (idempotent upsert)...`,
  );

  await db.transaction(async (tx) => {
    for (const t of TOURNAMENT_2025_TEAMS) {
      const logoUrl = `https://a.espncdn.com/i/teamlogos/ncaa/500/${t.espnId}.png`;

      await tx
        .insert(team)
        .values({
          name: t.name,
          shortName: t.shortName,
          abbreviation: t.abbreviation,
          logoUrl,
          espnId: t.espnId,
        })
        .onConflictDoUpdate({
          target: team.espnId,
          set: {
            name: t.name,
            shortName: t.shortName,
            abbreviation: t.abbreviation,
            logoUrl,
          },
        });

      console.log(`  ✓ ${t.name}`);
    }
  });

  console.log("\nDone! Upserted all 68 teams.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
