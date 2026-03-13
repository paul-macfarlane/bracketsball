import { NextResponse } from "next/server";

import { syncTournament, getActiveTournamentId } from "@/lib/espn-sync/sync";
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

  const today = new Date().toISOString().split("T")[0];
  const result = await syncTournament(tournamentId, espnAdapter, today);

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
    date: today,
    tournamentId,
    totalDurationMs,
    ...result,
  });
}
