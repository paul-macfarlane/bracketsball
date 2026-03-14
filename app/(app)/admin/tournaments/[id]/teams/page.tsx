import { notFound } from "next/navigation";

import { PageBreadcrumbs } from "@/components/page-breadcrumbs";

import {
  getTournamentById,
  getTournamentTeams,
} from "@/lib/db/queries/tournaments";
import { getTeams } from "@/lib/db/queries/teams";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { REGION_DISPLAY_NAMES } from "@/lib/validators/tournament";
import { getTournamentGames } from "@/lib/db/queries/tournaments";
import { AddTeamForm } from "./add-team-form";
import { EditTeamButton } from "./edit-team-button";
import { EditTeamStatsButton } from "./edit-team-stats-button";
import { RemoveTeamButton } from "./remove-team-button";

export default async function TournamentTeamsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const [tournamentTeams, allTeams, games] = await Promise.all([
    getTournamentTeams(id),
    getTeams(),
    getTournamentGames(id),
  ]);

  const assignedTeamIds = new Set(tournamentTeams.map((tt) => tt.teamId));
  const availableTeams = allTeams.filter((t) => !assignedTeamIds.has(t.id));
  const locked = games.some(
    (g) => g.status === "in_progress" || g.status === "final",
  );

  const teamsByRegion = Object.groupBy(tournamentTeams, (tt) => tt.region);

  return (
    <div>
      <PageBreadcrumbs
        crumbs={[
          { label: "Tournaments", href: "/admin/tournaments" },
          { label: tournament.name, href: `/admin/tournaments/${id}` },
          { label: "Teams" },
        ]}
        className="mb-4"
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {tournament.name} — Teams ({tournamentTeams.length}/68)
        </h1>
      </div>

      {locked && (
        <div className="mb-6 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4 text-sm text-yellow-700 dark:text-yellow-400">
          Team roster is locked because one or more games have started. Reset
          all games to scheduled to make changes.
        </div>
      )}

      {!locked && availableTeams.length > 0 && tournamentTeams.length < 68 && (
        <div className="mb-6 rounded-md border p-4">
          <h2 className="mb-3 text-lg font-semibold">Add Team</h2>
          <AddTeamForm
            tournamentId={id}
            availableTeams={availableTeams.map((t) => ({
              id: t.id,
              name: t.name,
            }))}
          />
        </div>
      )}

      {(["south", "east", "west", "midwest"] as const).map((region) => {
        const regionTeams = teamsByRegion[region] ?? [];
        return (
          <div key={region} className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">
              {REGION_DISPLAY_NAMES[region]} ({regionTeams.length})
            </h2>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Seed</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionTeams.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground"
                      >
                        No teams assigned.
                      </TableCell>
                    </TableRow>
                  ) : (
                    regionTeams.map((tt) => (
                      <TableRow key={tt.id}>
                        <TableCell className="font-mono">{tt.seed}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {tt.teamLogoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={tt.teamLogoUrl}
                                alt={tt.teamName}
                                className="h-5 w-5"
                              />
                            )}
                            {tt.teamName}
                            <span className="text-muted-foreground">
                              ({tt.teamAbbreviation})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <EditTeamButton
                              tournamentId={id}
                              tournamentTeamId={tt.id}
                              currentSeed={tt.seed}
                              currentRegion={tt.region}
                            />
                            <EditTeamStatsButton
                              tournamentId={id}
                              tournamentTeamId={tt.id}
                              teamName={tt.teamName}
                              currentStats={{
                                overallWins: tt.overallWins,
                                overallLosses: tt.overallLosses,
                                conferenceWins: tt.conferenceWins,
                                conferenceLosses: tt.conferenceLosses,
                                conferenceName: tt.conferenceName,
                                ppg: tt.ppg,
                                oppPpg: tt.oppPpg,
                                fgPct: tt.fgPct,
                                threePtPct: tt.threePtPct,
                                ftPct: tt.ftPct,
                                reboundsPerGame: tt.reboundsPerGame,
                                assistsPerGame: tt.assistsPerGame,
                                stealsPerGame: tt.stealsPerGame,
                                blocksPerGame: tt.blocksPerGame,
                                turnoversPerGame: tt.turnoversPerGame,
                                apRanking: tt.apRanking,
                                strengthOfSchedule: tt.strengthOfSchedule,
                              }}
                            />
                            <RemoveTeamButton
                              tournamentId={id}
                              tournamentTeamId={tt.id}
                              teamName={tt.teamName}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
