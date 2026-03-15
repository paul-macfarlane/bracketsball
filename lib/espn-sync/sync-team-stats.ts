/**
 * Syncs team stats from ESPN into the tournament_team table.
 */

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { team, tournamentTeam } from "@/lib/db/schema";
import { fetchAllTeamStats, type TeamStats } from "./espn-team-stats";

interface TeamStatsSyncResult {
  teamsUpdated: number;
  teamsSkipped: number;
  errors: string[];
}

type TournamentTeamUpdate = Partial<typeof tournamentTeam.$inferInsert>;

/**
 * Build a partial update object from ESPN stats, only including non-null fields
 * so that manually entered data is not overwritten.
 */
function buildStatsUpdate(stats: TeamStats): TournamentTeamUpdate {
  const update: TournamentTeamUpdate = {
    statsSyncedAt: new Date(),
  };

  if (stats.overallWins != null) update.overallWins = stats.overallWins;
  if (stats.overallLosses != null) update.overallLosses = stats.overallLosses;
  if (stats.conferenceWins != null)
    update.conferenceWins = stats.conferenceWins;
  if (stats.conferenceLosses != null)
    update.conferenceLosses = stats.conferenceLosses;
  if (stats.conferenceName != null)
    update.conferenceName = stats.conferenceName;
  if (stats.ppg != null) update.ppg = stats.ppg;
  if (stats.oppPpg != null) update.oppPpg = stats.oppPpg;
  if (stats.fgPct != null) update.fgPct = stats.fgPct;
  if (stats.threePtPct != null) update.threePtPct = stats.threePtPct;
  if (stats.ftPct != null) update.ftPct = stats.ftPct;
  if (stats.reboundsPerGame != null)
    update.reboundsPerGame = stats.reboundsPerGame;
  if (stats.assistsPerGame != null)
    update.assistsPerGame = stats.assistsPerGame;
  if (stats.stealsPerGame != null) update.stealsPerGame = stats.stealsPerGame;
  if (stats.blocksPerGame != null) update.blocksPerGame = stats.blocksPerGame;
  if (stats.turnoversPerGame != null)
    update.turnoversPerGame = stats.turnoversPerGame;
  if (stats.apRanking != null) update.apRanking = stats.apRanking;

  return update;
}

/**
 * Sync team stats from ESPN for all teams in a tournament.
 */
export async function syncTeamStats(
  tournamentId: string,
  onProgress?: (completed: number, total: number) => void,
  season?: number,
): Promise<TeamStatsSyncResult> {
  const result: TeamStatsSyncResult = {
    teamsUpdated: 0,
    teamsSkipped: 0,
    errors: [],
  };

  // Get all tournament teams with their ESPN IDs
  const tournamentTeams = await db
    .select({
      tournamentTeamId: tournamentTeam.id,
      teamId: tournamentTeam.teamId,
      espnId: team.espnId,
      teamName: team.name,
    })
    .from(tournamentTeam)
    .innerJoin(team, eq(tournamentTeam.teamId, team.id))
    .where(eq(tournamentTeam.tournamentId, tournamentId));

  const teamsWithEspnId = tournamentTeams.filter((t) => t.espnId);
  const teamsWithoutEspnId = tournamentTeams.filter((t) => !t.espnId);

  if (teamsWithoutEspnId.length > 0) {
    result.errors.push(
      `${teamsWithoutEspnId.length} teams missing ESPN ID: ${teamsWithoutEspnId.map((t) => t.teamName).join(", ")}`,
    );
    result.teamsSkipped += teamsWithoutEspnId.length;
  }

  if (teamsWithEspnId.length === 0) {
    return result;
  }

  // Fetch stats from ESPN
  const espnIds = teamsWithEspnId.map((t) => t.espnId!);
  const allStats = await fetchAllTeamStats(espnIds, onProgress, season);

  // Build lookup
  const statsByEspnId = new Map<string, TeamStats>();
  for (const stats of allStats) {
    statsByEspnId.set(stats.espnId, stats);
  }

  // Update tournament_team rows in a transaction
  await db.transaction(async (tx) => {
    for (const tt of teamsWithEspnId) {
      const stats = statsByEspnId.get(tt.espnId!);
      if (!stats) {
        result.teamsSkipped++;
        continue;
      }

      try {
        const updateData = buildStatsUpdate(stats);

        await tx
          .update(tournamentTeam)
          .set(updateData)
          .where(eq(tournamentTeam.id, tt.tournamentTeamId));
        result.teamsUpdated++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        result.errors.push(`Error updating ${tt.teamName}: ${message}`);
      }
    }
  });

  return result;
}
