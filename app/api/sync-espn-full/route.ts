import { and, eq, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { tournamentGame } from "@/lib/db/schema";
import { espnAdapter } from "@/lib/espn-sync/espn-adapter";
import {
  syncTournamentDateRange,
  getActiveTournamentId,
} from "@/lib/espn-sync/sync";

export const maxDuration = 120;

export async function GET(request: Request) {
  const startTime = performance.now();

  // Validate cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tournamentId = await getActiveTournamentId();
  if (!tournamentId) {
    return NextResponse.json(
      { error: "No active tournament" },
      { status: 404 },
    );
  }

  // Derive date range from earliest and latest game start times
  const games = await db
    .select({ startTime: tournamentGame.startTime })
    .from(tournamentGame)
    .where(
      and(
        eq(tournamentGame.tournamentId, tournamentId),
        isNotNull(tournamentGame.startTime),
      ),
    );

  const startTimes = games
    .map((g) => g.startTime)
    .filter((t): t is Date => t !== null);

  if (startTimes.length === 0) {
    return NextResponse.json(
      { error: "No games with start times found — run initial sync first" },
      { status: 400 },
    );
  }

  const earliest = new Date(Math.min(...startTimes.map((t) => t.getTime())));
  const latest = new Date(Math.max(...startTimes.map((t) => t.getTime())));

  const startDate = earliest.toISOString().split("T")[0];
  const endDate = latest.toISOString().split("T")[0];

  const result = await syncTournamentDateRange(
    tournamentId,
    espnAdapter,
    startDate,
    endDate,
  );

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.log(
    `[sync-espn-full] Completed in ${totalDurationMs}ms (${startDate} to ${endDate}) — ` +
      `games: ${result.gamesUpdated} updated, ${result.gamesSkipped} skipped` +
      (result.errors.length > 0 ? `, errors: ${result.errors.length}` : "") +
      (result.timing
        ? ` | espnFetch: ${result.timing.espnFetchMs}ms, dbTransaction: ${result.timing.dbTransactionMs}ms, standingsRecalc: ${result.timing.standingsRecalcMs}ms`
        : ""),
  );

  return NextResponse.json({
    startDate,
    endDate,
    tournamentId,
    totalDurationMs,
    ...result,
  });
}
