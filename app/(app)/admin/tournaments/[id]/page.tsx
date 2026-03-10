import Link from "next/link";
import { notFound } from "next/navigation";

import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import {
  getTournamentById,
  getTournamentTeams,
  getTournamentGames,
} from "@/lib/db/queries/tournaments";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleActiveButton } from "./toggle-active-button";
import { DeleteTournamentButton } from "./delete-tournament-button";
import { BracketPositionsForm } from "./bracket-positions-form";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = await getTournamentById(id);

  if (!tournament) {
    notFound();
  }

  const [teams, games] = await Promise.all([
    getTournamentTeams(id),
    getTournamentGames(id),
  ]);

  return (
    <div>
      <PageBreadcrumbs
        crumbs={[
          { label: "Tournaments", href: "/admin/tournaments" },
          { label: tournament.name },
        ]}
        className="mb-4"
      />
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="text-muted-foreground">
            {tournament.year}{" "}
            {tournament.isActive ? (
              <Badge className="ml-2">Active</Badge>
            ) : (
              <Badge variant="secondary" className="ml-2">
                Inactive
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleActiveButton
            tournamentId={id}
            isActive={tournament.isActive}
          />
          <DeleteTournamentButton
            tournamentId={id}
            tournamentName={tournament.name}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href={`/admin/tournaments/${id}/teams`}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>Teams ({teams.length}/68)</CardTitle>
              <CardDescription>
                Assign teams to this tournament with seeds and regions.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href={`/admin/tournaments/${id}/games`}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle>Games ({games.length})</CardTitle>
              <CardDescription>
                Manage bracket matchups, scores, and results.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <div className="mt-6">
        <BracketPositionsForm
          tournamentId={id}
          initialPositions={{
            bracketTopLeftRegion: tournament.bracketTopLeftRegion,
            bracketBottomLeftRegion: tournament.bracketBottomLeftRegion,
            bracketTopRightRegion: tournament.bracketTopRightRegion,
            bracketBottomRightRegion: tournament.bracketBottomRightRegion,
          }}
          disabled={games.some(
            (g) => g.status === "in_progress" || g.status === "final",
          )}
        />
      </div>

      {teams.length === 68 && games.length === 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Bracket</CardTitle>
              <CardDescription>
                All 68 teams are assigned. Go to Games to generate the bracket
                structure.
              </CardDescription>
              <Button asChild className="mt-2 w-fit">
                <Link href={`/admin/tournaments/${id}/games`}>Go to Games</Link>
              </Button>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}
