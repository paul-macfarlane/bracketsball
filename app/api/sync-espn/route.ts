import { NextResponse } from "next/server";

import {
  syncTournamentDateRange,
  getActiveTournamentId,
} from "@/lib/espn-sync/sync";
import { espnAdapter } from "@/lib/espn-sync/espn-adapter";

export const maxDuration = 30;

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

  // Sync both UTC today and yesterday to handle the ET/UTC timezone boundary.
  // Games played in the evening ET (e.g. 9 PM EDT) fall on the next UTC date,
  // so querying only the UTC date misses in-progress or recently-finished games.
  const now = new Date();
  const todayUTC = now.toISOString().split("T")[0];
  const yesterdayUTC = new Date(now.getTime() - 86_400_000)
    .toISOString()
    .split("T")[0];

  const result = await syncTournamentDateRange(
    tournamentId,
    espnAdapter,
    yesterdayUTC,
    todayUTC,
  );

  const totalDurationMs = Math.round(performance.now() - startTime);
  console.log(
    `[sync-espn] Completed in ${totalDurationMs}ms — ` +
      `games: ${result.gamesUpdated} updated, ${result.gamesSkipped} skipped` +
      (result.errors.length > 0 ? `, errors: ${result.errors.length}` : "") +
      (result.timing
        ? ` | espnFetch: ${result.timing.espnFetchMs}ms, dbTransaction: ${result.timing.dbTransactionMs}ms, standingsRecalc: ${result.timing.standingsRecalcMs}ms`
        : ""),
  );

  return NextResponse.json({
    dates: [yesterdayUTC, todayUTC],
    tournamentId,
    totalDurationMs,
    ...result,
  });
}
