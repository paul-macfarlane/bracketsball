import { NextResponse } from "next/server";

import { syncTournament, getActiveTournamentId } from "@/lib/espn-sync/sync";
import { espnAdapter } from "@/lib/espn-sync/espn-adapter";

export async function GET(request: Request) {
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

  return NextResponse.json({
    date: today,
    tournamentId,
    ...result,
  });
}
