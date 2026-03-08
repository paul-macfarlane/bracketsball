"use client";

import { cn } from "@/lib/utils";
import type { BracketTeam } from "./types";

interface TeamSlotProps {
  team: BracketTeam | null;
  isSelected: boolean;
  isClickable: boolean;
  onClick: () => void;
  position: "top" | "bottom";
}

function TeamSlot({
  team,
  isSelected,
  isClickable,
  onClick,
  position,
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
        isSelected && "bg-primary text-primary-foreground",
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
              <span className="text-primary-foreground">{team.seed}</span>
            ) : (
              team.seed
            )}
          </span>
          <span className="truncate font-medium">{team.shortName}</span>
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
}

export function MatchupCard({
  gameId,
  team1,
  team2,
  pickedTeamId,
  onPick,
  disabled = false,
}: MatchupCardProps) {
  const canPick = !disabled && !!team1 && !!team2;

  return (
    <div className="w-44 rounded-md border border-border bg-card shadow-sm">
      <TeamSlot
        team={team1}
        isSelected={!!team1 && pickedTeamId === team1.id}
        isClickable={canPick}
        onClick={() => team1 && onPick(gameId, team1.id)}
        position="top"
      />
      <TeamSlot
        team={team2}
        isSelected={!!team2 && pickedTeamId === team2.id}
        isClickable={canPick}
        onClick={() => team2 && onPick(gameId, team2.id)}
        position="bottom"
      />
    </div>
  );
}
