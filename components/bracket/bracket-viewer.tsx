"use client";

import { useCallback, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { StickySubHeader } from "@/components/sticky-sub-header";
import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { BracketFullView } from "./bracket-full-view";
import type { BracketPositions } from "./bracket-full-view";
import type { BracketGame, BracketTeam, BracketPick } from "./types";
import { getPointsForRound, type PoolScoring } from "@/lib/scoring";
import {
  EliminationBanner,
  type EliminationInfo,
} from "@/components/pool/elimination-banner";
import { formatOrdinal } from "@/lib/utils";

interface BracketViewerProps {
  bracketName: string;
  bracketStatus: string;
  totalPoints: number;
  potentialPoints: number;
  games: BracketGame[];
  tournamentTeams: BracketTeam[];
  picks: BracketPick[];
  bracketPositions?: BracketPositions;
  poolScoring: PoolScoring;
  poolId?: string;
  poolName?: string;
  rankInfo?: { rank: number; totalEntries: number } | null;
  eliminationInfo?: EliminationInfo | null;
  tiebreakerScore?: number | null;
}

export function BracketViewer({
  bracketName,
  bracketStatus,
  totalPoints,
  potentialPoints,
  games,
  tournamentTeams,
  picks: picksList,
  bracketPositions,
  poolScoring,
  poolId,
  poolName,
  rankInfo,
  eliminationInfo,
  tiebreakerScore,
}: BracketViewerProps) {
  const picks = useMemo(
    () => new Map(picksList.map((p) => [p.tournamentGameId, p.pickedTeamId])),
    [picksList],
  );

  const teamsById = useMemo(
    () => new Map(tournamentTeams.map((t) => [t.id, t])),
    [tournamentTeams],
  );

  const gamesById = useMemo(
    () => new Map(games.map((g) => [g.id, g])),
    [games],
  );

  const roundPointsMap = useMemo(() => {
    const map = new Map<string, number>();
    const rounds = [
      "first_four",
      "round_of_64",
      "round_of_32",
      "sweet_16",
      "elite_8",
      "final_four",
      "championship",
    ];
    for (const round of rounds) {
      map.set(round, getPointsForRound(round, poolScoring));
    }
    return map;
  }, [poolScoring]);

  const getTeamById = useCallback(
    (teamId: string): BracketTeam | null => teamsById.get(teamId) ?? null,
    [teamsById],
  );

  const getTeamsForGame = useCallback(
    (gameId: string): [BracketTeam | null, BracketTeam | null] => {
      const game = gamesById.get(gameId);
      if (!game) return [null, null];

      let team1: BracketTeam | null = null;
      let team2: BracketTeam | null = null;

      // Prioritize actual team data (accurate for completed/in-progress games).
      // Fall back to user's pick from source game (for future games without teams set yet).
      if (game.team1Id) {
        team1 = teamsById.get(game.team1Id) ?? null;
      } else if (game.sourceGame1Id) {
        const pickedTeamId = picks.get(game.sourceGame1Id);
        if (pickedTeamId) team1 = teamsById.get(pickedTeamId) ?? null;
      }

      if (game.team2Id) {
        team2 = teamsById.get(game.team2Id) ?? null;
      } else if (game.sourceGame2Id) {
        const pickedTeamId = picks.get(game.sourceGame2Id);
        if (pickedTeamId) team2 = teamsById.get(pickedTeamId) ?? null;
      }

      return [team1, team2];
    },
    [gamesById, teamsById, picks],
  );

  return (
    <div>
      {/* Header */}
      <StickySubHeader>
        {poolName && poolId && (
          <PageBreadcrumbs
            crumbs={[
              { label: "Pools", href: "/pools" },
              { label: poolName, href: `/pools/${poolId}` },
              { label: bracketName },
            ]}
            className="mb-2"
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">{bracketName}</h1>
            <Badge
              variant={bracketStatus === "submitted" ? "default" : "secondary"}
            >
              {bracketStatus === "submitted" ? "Submitted" : "Draft"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {rankInfo && (
              <>
                <span className="font-semibold">
                  {formatOrdinal(rankInfo.rank)}
                </span>
                <span className="text-muted-foreground">|</span>
              </>
            )}
            <span className="font-semibold">Points: {totalPoints}</span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">
              Potential: {potentialPoints}
            </span>
          </div>
        </div>
      </StickySubHeader>

      {/* Elimination banner */}
      {eliminationInfo && (
        <EliminationBanner
          eliminationInfo={eliminationInfo}
          currentPoints={totalPoints}
        />
      )}

      {/* Bracket view — disabled (read-only) */}
      <BracketFullView
        games={games}
        picks={picks}
        getTeamsForGame={getTeamsForGame}
        getTeamById={getTeamById}
        onPick={() => {}}
        disabled={true}
        bracketPositions={bracketPositions}
        roundPointsMap={roundPointsMap}
        tiebreakerScore={tiebreakerScore}
      />
    </div>
  );
}
