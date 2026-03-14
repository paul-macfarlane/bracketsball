"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { BracketGame, BracketTeam, BracketPick } from "./types";
import { savePickAction } from "@/app/(app)/pools/[id]/brackets/actions";

interface UseBracketPicksParams {
  bracketEntryId: string;
  games: BracketGame[];
  tournamentTeams: BracketTeam[];
  initialPicks: BracketPick[];
}

export function useBracketPicks({
  bracketEntryId,
  games,
  tournamentTeams,
  initialPicks,
}: UseBracketPicksParams) {
  const [picks, setPicks] = useState<Map<string, string>>(
    () =>
      new Map(initialPicks.map((p) => [p.tournamentGameId, p.pickedTeamId])),
  );
  const [, startTransition] = useTransition();
  const teamMap = useMemo(
    () => new Map(tournamentTeams.map((t) => [t.id, t])),
    [tournamentTeams],
  );
  const gameMap = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);

  // Track in-flight saves to prevent stale overwrites
  const pendingSaves = useRef(new Set<string>());

  // Resolve the two teams available for a given game based on picks
  // Look up any team by ID (used for resolving picked teams in indicators)
  const getTeamById = useCallback(
    (teamId: string): BracketTeam | null => teamMap.get(teamId) ?? null,
    [teamMap],
  );

  const getTeamsForGame = useCallback(
    (gameId: string): [BracketTeam | null, BracketTeam | null] => {
      const game = gameMap.get(gameId);
      if (!game) return [null, null];

      let team1: BracketTeam | null = null;
      let team2: BracketTeam | null = null;

      // Prioritize actual team data (accurate for completed/in-progress games).
      // Fall back to user's pick from source game (for future games without teams set yet).
      if (game.team1Id) {
        team1 = teamMap.get(game.team1Id) ?? null;
      } else if (game.sourceGame1Id) {
        const pickedId = picks.get(game.sourceGame1Id);
        team1 = pickedId ? (teamMap.get(pickedId) ?? null) : null;
      }

      if (game.team2Id) {
        team2 = teamMap.get(game.team2Id) ?? null;
      } else if (game.sourceGame2Id) {
        const pickedId = picks.get(game.sourceGame2Id);
        team2 = pickedId ? (teamMap.get(pickedId) ?? null) : null;
      }

      return [team1, team2];
    },
    [gameMap, teamMap, picks],
  );

  // Find all downstream games from a given game
  const findDownstreamGames = useCallback(
    (gameId: string): string[] => {
      const downstream: string[] = [];
      const queue = [gameId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const game of games) {
          if (
            game.sourceGame1Id === current ||
            game.sourceGame2Id === current
          ) {
            downstream.push(game.id);
            queue.push(game.id);
          }
        }
      }

      return downstream;
    },
    [games],
  );

  const handlePick = useCallback(
    (gameId: string, teamId: string) => {
      if (pendingSaves.current.has(gameId)) return;

      // Optimistically update picks
      setPicks((prev) => {
        const next = new Map(prev);
        next.set(gameId, teamId);

        // Clear invalid downstream picks
        const downstream = findDownstreamGames(gameId);
        for (const dsGameId of downstream) {
          const existingPick = next.get(dsGameId);
          if (existingPick) {
            const dsGame = gameMap.get(dsGameId);
            if (!dsGame) continue;

            // Check if the existing pick can still reach this game
            let team1Id: string | null = null;
            let team2Id: string | null = null;

            if (dsGame.sourceGame1Id) {
              team1Id = next.get(dsGame.sourceGame1Id) ?? null;
            } else {
              team1Id = dsGame.team1Id;
            }

            if (dsGame.sourceGame2Id) {
              team2Id = next.get(dsGame.sourceGame2Id) ?? null;
            } else {
              team2Id = dsGame.team2Id;
            }

            if (existingPick !== team1Id && existingPick !== team2Id) {
              next.delete(dsGameId);
            }
          }
        }

        return next;
      });

      // Save to server
      pendingSaves.current.add(gameId);
      startTransition(async () => {
        const result = await savePickAction(bracketEntryId, gameId, teamId);
        pendingSaves.current.delete(gameId);
        if (result.error) {
          toast.error(result.error);
          // Revert on error
          setPicks((prev) => {
            const next = new Map(prev);
            const initialPick = initialPicks.find(
              (p) => p.tournamentGameId === gameId,
            );
            if (initialPick) {
              next.set(gameId, initialPick.pickedTeamId);
            } else {
              next.delete(gameId);
            }
            return next;
          });
        }
      });
    },
    [
      bracketEntryId,
      findDownstreamGames,
      gameMap,
      initialPicks,
      startTransition,
    ],
  );

  const applyBulkPicks = useCallback(
    (newPicks: { tournamentGameId: string; pickedTeamId: string }[]) => {
      setPicks((prev) => {
        const next = new Map(prev);
        for (const pick of newPicks) {
          next.set(pick.tournamentGameId, pick.pickedTeamId);
        }
        return next;
      });
    },
    [],
  );

  const clearAllPicks = useCallback(() => {
    setPicks(new Map());
  }, []);

  // Exclude games that have already started — users can't pick those
  const pickableGameIds = useMemo(
    () =>
      new Set(games.filter((g) => g.status === "scheduled").map((g) => g.id)),
    [games],
  );
  const totalGames = pickableGameIds.size;
  const pickedGames = [...picks.keys()].filter((id) =>
    pickableGameIds.has(id),
  ).length;

  return {
    picks,
    handlePick,
    getTeamsForGame,
    getTeamById,
    applyBulkPicks,
    clearAllPicks,
    totalGames,
    pickedGames,
  };
}
