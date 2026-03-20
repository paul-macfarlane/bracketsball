"use client";

import { useState, useMemo } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TeamLogo } from "@/components/team-logo";
import { ROUND_LABELS } from "@/components/bracket/types";
import {
  computeWhatINeed,
  type WhatINeedGame,
  type WhatINeedRoundGroup,
} from "@/lib/what-i-need";
import type { PoolScoring } from "@/lib/scoring";

function formatGameTime(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface BracketOption {
  id: string;
  name: string;
}

interface GameInput {
  id: string;
  round: string;
  status: string;
  statusDetail: string | null;
  startTime: string | null;
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerTeamId: string | null;
}

interface TeamMapEntry {
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
}

interface WhatINeedCardProps {
  brackets: BracketOption[];
  picksByBracket: Record<
    string,
    { tournamentGameId: string; pickedTeamId: string }[]
  >;
  games: GameInput[];
  poolScoring: PoolScoring;
  teamMap: Record<string, TeamMapEntry>;
}

export function WhatINeedCard({
  brackets,
  picksByBracket,
  games,
  poolScoring,
  teamMap,
}: WhatINeedCardProps) {
  const [selectedBracketId, setSelectedBracketId] = useState(
    () => brackets[0]?.id ?? "",
  );

  const teamMapObj = useMemo(() => new Map(Object.entries(teamMap)), [teamMap]);

  const roundGroups: WhatINeedRoundGroup[] = useMemo(() => {
    const picks = picksByBracket[selectedBracketId] ?? [];
    return computeWhatINeed(games, picks, poolScoring, teamMapObj);
  }, [selectedBracketId, picksByBracket, games, poolScoring, teamMapObj]);

  const totalGames = roundGroups.reduce(
    (sum, group) => sum + group.games.length,
    0,
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>What I Need</CardTitle>
            <CardDescription>
              Teams to root for based on your picks
            </CardDescription>
          </div>
          {brackets.length > 1 && (
            <Select
              value={selectedBracketId}
              onValueChange={setSelectedBracketId}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brackets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalGames === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">
            No upcoming games to track.
          </p>
        ) : (
          <div className="space-y-6">
            {roundGroups.map((group) => (
              <div key={group.round}>
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {group.roundLabel}
                </h3>
                {/* Desktop */}
                <div className="hidden space-y-2 md:block">
                  {group.games.map((game) => (
                    <DesktopGameRow key={game.gameId} game={game} />
                  ))}
                </div>
                {/* Mobile */}
                <div className="space-y-2 md:hidden">
                  {group.games.map((game) => (
                    <MobileGameCard key={game.gameId} game={game} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TeamDisplay({
  team,
  impact,
  furthestRound,
  isRootFor,
  isEliminated,
  showScore,
}: {
  team: WhatINeedGame["team1"];
  impact: number;
  furthestRound: string | null;
  isRootFor: boolean;
  isEliminated: boolean;
  showScore: boolean;
}) {
  if (!team) return null;

  return (
    <div
      className={`flex items-center gap-2 ${isRootFor ? "" : isEliminated ? "opacity-40 line-through" : "opacity-50"}`}
    >
      <TeamLogo
        logoUrl={team.logoUrl}
        darkLogoUrl={team.darkLogoUrl}
        alt={team.name}
        className="h-6 w-6 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{team.seed}</span>
          <span className="truncate text-sm font-medium">{team.shortName}</span>
          {showScore && team.score !== null && (
            <span className="text-sm font-semibold">{team.score}</span>
          )}
          {isEliminated && (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] text-muted-foreground"
            >
              Eliminated
            </Badge>
          )}
        </div>
        {isRootFor && impact > 0 && (
          <div className="flex items-center gap-1">
            <Badge
              variant="secondary"
              className="h-5 px-1.5 text-[10px] font-semibold"
            >
              {impact} pts at stake
            </Badge>
            {furthestRound && (
              <span className="text-[10px] text-muted-foreground">
                Picked to {ROUND_LABELS[furthestRound] ?? furthestRound}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopGameRow({ game }: { game: WhatINeedGame }) {
  const isNoStake = game.rootFor === "none";
  const isInProgress = game.status === "in_progress";

  return (
    <div
      className={`flex items-center gap-4 rounded-md border p-3 ${
        isNoStake ? "opacity-50" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <div className="min-w-0 flex-1">
          <TeamDisplay
            team={game.team1}
            impact={game.team1Impact}
            furthestRound={game.team1FurthestRound}
            isRootFor={game.rootFor === "team1" || game.rootFor === "both"}
            isEliminated={game.team1Eliminated}
            showScore={isInProgress}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          vs
        </span>
        <div className="min-w-0 flex-1">
          <TeamDisplay
            team={game.team2}
            impact={game.team2Impact}
            furthestRound={game.team2FurthestRound}
            isRootFor={game.rootFor === "team2" || game.rootFor === "both"}
            isEliminated={game.team2Eliminated}
            showScore={isInProgress}
          />
        </div>
      </div>
      <div className="shrink-0 text-right">
        {isNoStake && (
          <span className="text-xs text-muted-foreground">No stake</span>
        )}
        {isInProgress && (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              Live
            </Badge>
            {game.statusDetail && (
              <span className="text-[10px] text-muted-foreground">
                {game.statusDetail}
              </span>
            )}
          </div>
        )}
        {!isInProgress && !isNoStake && game.startTime && (
          <span className="text-[10px] text-muted-foreground">
            {formatGameTime(game.startTime)}
          </span>
        )}
      </div>
    </div>
  );
}

function MobileGameCard({ game }: { game: WhatINeedGame }) {
  const isNoStake = game.rootFor === "none";
  const isInProgress = game.status === "in_progress";

  return (
    <div className={`rounded-md border p-3 ${isNoStake ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        {isInProgress && (
          <div className="mb-2 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px]">
              Live
            </Badge>
            {game.statusDetail && (
              <span className="text-[10px] text-muted-foreground">
                {game.statusDetail}
              </span>
            )}
          </div>
        )}
        {!isInProgress && !isNoStake && game.startTime && (
          <span className="mb-2 text-[10px] text-muted-foreground">
            {formatGameTime(game.startTime)}
          </span>
        )}
        {isNoStake && (
          <span className="mb-2 text-xs text-muted-foreground">No stake</span>
        )}
      </div>
      <div className="space-y-2">
        <TeamDisplay
          team={game.team1}
          impact={game.team1Impact}
          furthestRound={game.team1FurthestRound}
          isRootFor={game.rootFor === "team1" || game.rootFor === "both"}
          isEliminated={game.team1Eliminated}
          showScore={isInProgress}
        />
        <div className="border-t" />
        <TeamDisplay
          team={game.team2}
          impact={game.team2Impact}
          furthestRound={game.team2FurthestRound}
          isRootFor={game.rootFor === "team2" || game.rootFor === "both"}
          isEliminated={game.team2Eliminated}
          showScore={isInProgress}
        />
      </div>
    </div>
  );
}
