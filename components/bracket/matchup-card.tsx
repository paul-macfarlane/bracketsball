"use client";

import { cn } from "@/lib/utils";
import type { BracketTeam } from "./types";

type PickResult = "correct" | "incorrect" | "pending" | null;

interface TeamSlotProps {
  team: BracketTeam | null;
  isSelected: boolean;
  isClickable: boolean;
  onClick: () => void;
  position: "top" | "bottom";
  pickResult: PickResult;
  score: number | null;
}

function TeamSlot({
  team,
  isSelected,
  isClickable,
  onClick,
  position,
  pickResult,
  score,
}: TeamSlotProps) {
  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors",
        position === "top"
          ? "rounded-t-md border-b border-border"
          : "rounded-b-md",
        // Default selected state (no result yet or pending)
        isSelected &&
          pickResult !== "correct" &&
          pickResult !== "incorrect" &&
          "bg-primary text-primary-foreground",
        // Correct pick
        isSelected &&
          pickResult === "correct" &&
          "bg-success text-success-foreground",
        // Incorrect pick
        isSelected &&
          pickResult === "incorrect" &&
          "bg-failure text-failure-foreground",
        !isSelected && isClickable && "hover:bg-muted",
        !isClickable && !isSelected && "cursor-default opacity-60",
        !team && "italic text-muted-foreground",
      )}
    >
      {team ? (
        <>
          {team.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logoUrl}
              alt={team.abbreviation}
              className={cn(
                "h-4 w-4 shrink-0 object-contain",
                isSelected && "brightness-0 invert",
              )}
            />
          )}
          <span className="min-w-[1.25rem] text-xs font-medium text-muted-foreground">
            {isSelected ? (
              <span className="text-inherit">{team.seed}</span>
            ) : (
              team.seed
            )}
          </span>
          <span className="truncate font-medium">{team.shortName}</span>
          {score !== null && (
            <span className="ml-auto text-xs opacity-80">{score}</span>
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
  roundPoints?: number;
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
  roundPoints = 0,
}: MatchupCardProps) {
  const canPick = !disabled && !!team1 && !!team2;
  const isFinal = gameStatus === "final";

  function getPickResult(teamId: string | null): PickResult {
    if (!teamId || !pickedTeamId || pickedTeamId !== teamId) return null;
    if (!isFinal || !winnerTeamId) return "pending";
    return pickedTeamId === winnerTeamId ? "correct" : "incorrect";
  }

  const team1PickResult = getPickResult(team1?.id ?? null);
  const team2PickResult = getPickResult(team2?.id ?? null);

  // Show points badge on the picked team slot if correct
  const team1Score =
    team1PickResult === "correct" && roundPoints > 0 ? roundPoints : null;
  const team2Score =
    team2PickResult === "correct" && roundPoints > 0 ? roundPoints : null;

  return (
    <div className="w-44 rounded-md border border-border bg-card shadow-sm">
      <TeamSlot
        team={team1}
        isSelected={!!team1 && pickedTeamId === team1.id}
        isClickable={canPick}
        onClick={() => team1 && onPick(gameId, team1.id)}
        position="top"
        pickResult={team1PickResult}
        score={team1Score}
      />
      <TeamSlot
        team={team2}
        isSelected={!!team2 && pickedTeamId === team2.id}
        isClickable={canPick}
        onClick={() => team2 && onPick(gameId, team2.id)}
        position="bottom"
        pickResult={team2PickResult}
        score={team2Score}
      />
    </div>
  );
}
