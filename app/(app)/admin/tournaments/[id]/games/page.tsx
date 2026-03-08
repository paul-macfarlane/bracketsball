import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  getTournamentById,
  getTournamentTeams,
  getTournamentGames,
} from "@/lib/db/queries/tournaments";
import {
  ROUND_DISPLAY_NAMES,
  REGION_DISPLAY_NAMES,
  TOURNAMENT_ROUNDS,
} from "@/lib/validators/tournament";
import { Badge } from "@/components/ui/badge";
import { GenerateBracketButton } from "./generate-bracket-button";
import { GameRow } from "./game-row";
import { SyncStandingsButton } from "./sync-standings-button";

export default async function TournamentGamesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const [tournamentTeams, games] = await Promise.all([
    getTournamentTeams(id),
    getTournamentGames(id),
  ]);

  const teamsMap = new Map(tournamentTeams.map((tt) => [tt.teamId, tt]));

  const gamesByRound = Object.groupBy(games, (g) => g.round);

  return (
    <div>
      <Link
        href={`/admin/tournaments/${id}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to {tournament.name}
      </Link>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {tournament.name} — Games ({games.length})
        </h1>
        <div className="flex items-center gap-2">
          {games.length > 0 && <SyncStandingsButton tournamentId={id} />}
          {games.length === 0 && tournamentTeams.length === 68 && (
            <GenerateBracketButton tournamentId={id} />
          )}
        </div>
      </div>

      {games.length === 0 && tournamentTeams.length < 68 && (
        <p className="text-muted-foreground">
          Assign all 68 teams before generating the bracket (
          {tournamentTeams.length}/68 assigned).
        </p>
      )}

      {TOURNAMENT_ROUNDS.map((round) => {
        const roundGames = gamesByRound[round] ?? [];
        if (roundGames.length === 0) return null;

        return (
          <div key={round} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">
              {ROUND_DISPLAY_NAMES[round]}
              <Badge variant="secondary" className="ml-2">
                {roundGames.length} games
              </Badge>
            </h2>
            <div className="space-y-2">
              {roundGames.map((game) => {
                const team1 = game.team1Id ? teamsMap.get(game.team1Id) : null;
                const team2 = game.team2Id ? teamsMap.get(game.team2Id) : null;
                return (
                  <GameRow
                    key={game.id}
                    game={game}
                    team1={
                      team1
                        ? {
                            name: team1.teamName,
                            seed: team1.seed,
                            logoUrl: team1.teamLogoUrl,
                          }
                        : null
                    }
                    team2={
                      team2
                        ? {
                            name: team2.teamName,
                            seed: team2.seed,
                            logoUrl: team2.teamLogoUrl,
                          }
                        : null
                    }
                    region={
                      game.region ? REGION_DISPLAY_NAMES[game.region] : null
                    }
                    tournamentId={id}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
