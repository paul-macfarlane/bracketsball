"use client";

import { useState } from "react";
import { Check, Info, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BracketTeam } from "./types";
import { TeamComparison } from "./team-comparison";
import { TeamLogo } from "@/components/team-logo";

type PickStatus = "correct" | "incorrect" | "eliminated" | "pending" | null;

/**
 * ESPN-style pick indicator shown above team rows when tournament is in progress.
 * - Green circle + check = correct pick
 * - Red circle + X = incorrect or eliminated pick
 * - No icon = pending (game not yet played)
 */
function PickIndicator({
  team,
  status,
}: {
  team: BracketTeam;
  status: Exclude<PickStatus, null>;
}) {
  const isCorrect = status === "correct";
  const isDead = status === "incorrect" || status === "eliminated";

  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-border px-2 py-0.5 text-[10px] font-medium",
        isCorrect && "bg-success/15 text-success",
        isDead && "bg-failure/15 text-failure",
        status === "pending" && "text-muted-foreground",
      )}
    >
      {isCorrect && (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-success">
          <Check className="h-2 w-2 text-success-foreground" />
        </span>
      )}
      {isDead && (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-failure">
          <X className="h-2 w-2 text-failure-foreground" />
        </span>
      )}
      <span className="truncate">My Pick: {team.abbreviation}</span>
    </div>
  );
}

interface TeamSlotProps {
  team: BracketTeam | null;
  isSelected: boolean;
  isClickable: boolean;
  onClick: () => void;
  position: "top" | "bottom";
  score: number | null;
  isWinner: boolean;
  isLoser: boolean;
  isEliminated: boolean;
  viewMode: boolean;
}

function TeamSlot({
  team,
  isSelected,
  isClickable,
  onClick,
  position,
  score,
  isWinner,
  isLoser,
  isEliminated,
  viewMode,
}: TeamSlotProps) {
  // In view mode: losers and eliminated (non-winner) teams are dimmed
  const isDimmed = viewMode && (isLoser || (isEliminated && !isWinner));
  // Strikethrough for eliminated teams that didn't play this game (dead predictions)
  const showStrikethrough = isEliminated && !isLoser && !isWinner;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors",
        position === "top" && "border-b border-border",

        // Edit mode (pre-tournament): highlight selected team
        !viewMode && isSelected && "bg-primary text-primary-foreground",
        !viewMode && !isSelected && isClickable && "hover:bg-muted",
        !viewMode && !isSelected && !isClickable && "cursor-default",

        // View mode (tournament started)
        viewMode && isDimmed && "text-muted-foreground",
        viewMode && "cursor-default",

        !team && "italic text-muted-foreground",
      )}
    >
      {team ? (
        <>
          <TeamLogo
            logoUrl={team.logoUrl}
            darkLogoUrl={team.darkLogoUrl}
            alt={team.abbreviation}
            className={cn(
              "h-4 w-4 shrink-0 object-contain",
              !viewMode && isSelected && "brightness-0 invert",
              isDimmed && "opacity-50",
            )}
          />
          <span
            className={cn(
              "min-w-[1.25rem] text-xs font-medium text-muted-foreground",
              !viewMode && isSelected && "text-inherit",
            )}
          >
            {team.seed}
          </span>
          <span
            className={cn(
              "truncate font-medium",
              showStrikethrough && "line-through",
              isWinner && "font-semibold",
            )}
          >
            {team.shortName}
          </span>
          {score !== null && (
            <span
              className={cn(
                "ml-auto text-xs font-semibold",
                isWinner && "text-foreground",
              )}
            >
              {score}
            </span>
          )}
        </>
      ) : (
        <span className="text-xs">TBD</span>
      )}
    </button>
  );
}

interface MatchupCardProps {
  gameId: string;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  pickedTeamId: string | null;
  onPick: (gameId: string, teamId: string) => void;
  disabled?: boolean;
  winnerTeamId?: string | null;
  gameStatus?: string;
  statusDetail?: string | null;
  roundPoints?: number;
  team1Score?: number | null;
  team2Score?: number | null;
  startTime?: Date | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueState?: string | null;
  eliminatedTeamIds?: Set<string>;
  actualTeam1Id?: string | null;
  actualTeam2Id?: string | null;
  pickedTeamData?: BracketTeam | null;
}

export function MatchupCard({
  gameId,
  team1,
  team2,
  pickedTeamId,
  onPick,
  disabled = false,
  winnerTeamId = null,
  gameStatus = "scheduled",
  statusDetail,
  roundPoints = 0,
  team1Score,
  team2Score,
  startTime,
  venueName,
  venueCity,
  venueState,
  eliminatedTeamIds,
  actualTeam1Id,
  actualTeam2Id,
  pickedTeamData: pickedTeamDataProp,
}: MatchupCardProps) {
  const [showComparison, setShowComparison] = useState(false);
  const isFinal = gameStatus === "final";
  const isInProgress = gameStatus === "in_progress";
  const isLive = isFinal || isInProgress;
  const isGameStarted = isLive;
  const canPick = !disabled && !isGameStarted && !!team1 && !!team2;
  const hasBothTeams = !!team1 && !!team2;
  // View mode: when the game has started OR when the bracket is globally locked
  const viewMode = isGameStarted || disabled;

  // Resolve the picked team object — may not be one of the displayed teams
  // if the team was eliminated and the actual game has different teams
  const pickedTeam = pickedTeamId
    ? team1?.id === pickedTeamId
      ? team1
      : team2?.id === pickedTeamId
        ? team2
        : (pickedTeamDataProp ?? null)
    : null;

  // Determine overall pick status for this card
  const pickStatus: PickStatus = (() => {
    if (!pickedTeam || !pickedTeamId) return null;
    // Eliminated: team lost in an earlier round and isn't actually in this game
    const isInActualGame =
      pickedTeamId === actualTeam1Id || pickedTeamId === actualTeam2Id;
    if (eliminatedTeamIds?.has(pickedTeamId) && !isInActualGame) {
      return "eliminated";
    }
    if (!isFinal || !winnerTeamId) return "pending";
    return pickedTeamId === winnerTeamId ? "correct" : "incorrect";
  })();

  // Per-team game result states
  const isTeamActual = (id: string) =>
    id === actualTeam1Id || id === actualTeam2Id;

  const t1Winner = isFinal && !!team1 && team1.id === winnerTeamId;
  const t1Loser =
    isFinal &&
    !!winnerTeamId &&
    !!team1 &&
    isTeamActual(team1.id) &&
    team1.id !== winnerTeamId;
  const t1Eliminated = !!team1 && !!eliminatedTeamIds?.has(team1.id);

  const t2Winner = isFinal && !!team2 && team2.id === winnerTeamId;
  const t2Loser =
    isFinal &&
    !!winnerTeamId &&
    !!team2 &&
    isTeamActual(team2.id) &&
    team2.id !== winnerTeamId;
  const t2Eliminated = !!team2 && !!eliminatedTeamIds?.has(team2.id);

  // Points earned for correct pick
  const earnedPoints =
    pickStatus === "correct" && roundPoints > 0 ? roundPoints : null;

  // Header content based on game state
  let headerContent: string;
  if (isFinal) {
    headerContent = "Final";
  } else if (isInProgress) {
    headerContent = statusDetail ?? "In Progress";
  } else {
    if (startTime) {
      const d = new Date(startTime);
      const date = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const time = d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      headerContent = `${date} · ${time}`;
    } else {
      headerContent = "TBD";
    }
  }

  // Show game scores on team slots when game is live/final
  const displayTeam1Score = isLive && team1Score != null ? team1Score : null;
  const displayTeam2Score = isLive && team2Score != null ? team2Score : null;

  // Footer: show compare for games that haven't started and bracket isn't locked
  const showCompare = !isGameStarted && !disabled && hasBothTeams;

  return (
    <>
      <div className="w-44 rounded-md border border-border bg-card shadow-sm">
        {/* Header: game status / date */}
        <div
          className={cn(
            "border-b border-border px-2 py-0.5 text-center text-[10px] text-muted-foreground",
            isInProgress && "font-medium text-warning",
            isFinal && "font-medium",
          )}
        >
          {headerContent}
        </div>

        {/* Pick indicator (ESPN-style, shown once tournament starts) */}
        {viewMode && pickedTeam && pickStatus && (
          <PickIndicator team={pickedTeam} status={pickStatus} />
        )}

        {/* Team rows */}
        <TeamSlot
          team={team1}
          isSelected={!!team1 && pickedTeamId === team1.id}
          isClickable={canPick}
          onClick={() => team1 && onPick(gameId, team1.id)}
          position="top"
          score={displayTeam1Score}
          isWinner={t1Winner}
          isLoser={t1Loser}
          isEliminated={t1Eliminated}
          viewMode={!!viewMode}
        />
        <TeamSlot
          team={team2}
          isSelected={!!team2 && pickedTeamId === team2.id}
          isClickable={canPick}
          onClick={() => team2 && onPick(gameId, team2.id)}
          position="bottom"
          score={displayTeam2Score}
          isWinner={t2Winner}
          isLoser={t2Loser}
          isEliminated={t2Eliminated}
          viewMode={!!viewMode}
        />

        {/* Footer: compare button (pre-tournament) or points earned */}
        {showCompare ? (
          <button
            type="button"
            disabled={!hasBothTeams}
            onClick={() => setShowComparison(true)}
            className="flex w-full items-center justify-center gap-1 border-t border-border py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Info className="h-3 w-3" />
            Compare
          </button>
        ) : (
          <div className="flex w-full items-center justify-center border-t border-border py-0.5 text-[10px]">
            {earnedPoints !== null ? (
              <span className="font-medium text-success">
                +{earnedPoints} pts
              </span>
            ) : (
              <span className="invisible">-</span>
            )}
          </div>
        )}
      </div>
      {hasBothTeams && (
        <TeamComparison
          team1={team1}
          team2={team2}
          open={showComparison}
          onOpenChange={setShowComparison}
          startTime={startTime}
          venueName={venueName}
          venueCity={venueCity}
          venueState={venueState}
        />
      )}
    </>
  );
}
