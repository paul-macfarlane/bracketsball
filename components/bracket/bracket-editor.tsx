"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BracketFullView } from "./bracket-full-view";
import type { BracketPositions } from "./bracket-full-view";
import { useBracketPicks } from "./use-bracket-picks";
import type { BracketGame, BracketTeam, BracketPick } from "./types";
import {
  updateBracketNameAction,
  updateTiebreakerAction,
  submitBracketAction,
  unsubmitBracketAction,
  deleteBracketEntryAction,
} from "@/app/(app)/pools/[id]/brackets/actions";
import {
  getPointsForRound,
  calculateBracketScores,
  type PoolScoring,
} from "@/lib/scoring";

interface BracketEditorProps {
  bracketEntryId: string;
  bracketName: string;
  bracketStatus: string;
  tiebreakerScore: number | null;
  games: BracketGame[];
  tournamentTeams: BracketTeam[];
  initialPicks: BracketPick[];
  poolId: string;
  bracketPositions?: BracketPositions;
  tournamentStarted: boolean;
  poolScoring?: PoolScoring;
}

export function BracketEditor({
  bracketEntryId,
  bracketName,
  bracketStatus,
  tiebreakerScore: initialTiebreaker,
  games,
  tournamentTeams,
  initialPicks,
  poolId,
  bracketPositions,
  tournamentStarted,
  poolScoring,
}: BracketEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(bracketName);
  const [tiebreaker, setTiebreaker] = useState<string>(
    initialTiebreaker?.toString() ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(bracketStatus);

  const { picks, handlePick, getTeamsForGame, totalGames, pickedGames } =
    useBracketPicks({
      bracketEntryId,
      games,
      tournamentTeams,
      initialPicks,
    });

  const tiebreakerValue = tiebreaker === "" ? null : parseInt(tiebreaker, 10);
  const isComplete =
    pickedGames >= totalGames &&
    tiebreakerValue !== null &&
    !isNaN(tiebreakerValue) &&
    tiebreakerValue >= 0;
  const isSubmitted = status === "submitted";
  const isLocked = tournamentStarted;
  const isDisabled = isSubmitted || isLocked;

  // Build round -> points map for the bracket view
  const roundPointsMap = useMemo(() => {
    if (!poolScoring) return undefined;
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

  // Calculate live scores from current picks and game results
  const scores = useMemo(() => {
    if (!poolScoring) return null;
    const currentPicks = Array.from(picks.entries()).map(
      ([tournamentGameId, pickedTeamId]) => ({
        tournamentGameId,
        pickedTeamId,
      }),
    );
    return calculateBracketScores(games, currentPicks, poolScoring);
  }, [poolScoring, picks, games]);

  function handleUnsubmit() {
    startTransition(async () => {
      const result = await unsubmitBracketAction(bracketEntryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setStatus("draft");
        toast.success("Bracket unsubmitted — you can now edit your picks.");
      }
    });
  }

  function handleNameBlur() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === bracketName) return;

    startTransition(async () => {
      const result = await updateBracketNameAction(bracketEntryId, trimmed);
      if (result.error) {
        toast.error(result.error);
        setName(bracketName);
      }
    });
  }

  function handleTiebreakerBlur() {
    const value = parseInt(tiebreaker, 10);
    if (isNaN(value) || value < 0 || value > 500) return;

    startTransition(async () => {
      const result = await updateTiebreakerAction(bracketEntryId, value);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitBracketAction(bracketEntryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setStatus("submitted");
        toast.success("Bracket submitted!");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBracketEntryAction(bracketEntryId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket deleted");
        router.push(`/pools/${poolId}`);
      }
    });
  }

  return (
    <div>
      {/* Locked banner */}
      {isLocked && (
        <div className="mb-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
          The tournament has started. Bracket editing is locked.
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            maxLength={100}
          />
          <Badge variant={isSubmitted ? "default" : "secondary"}>
            {isSubmitted ? "Submitted" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {scores && (
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">
                Points: {scores.totalPoints}
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">
                Potential: {scores.potentialPoints}
              </span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {pickedGames}/{totalGames} picks
          </span>
          {isSubmitted && !isLocked && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleUnsubmit}
            >
              Edit Picks
            </Button>
          )}
          {!isLocked && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isPending}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete bracket?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{name}&quot; and all its
                    picks. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Bracket view */}
      <BracketFullView
        games={games}
        picks={picks}
        getTeamsForGame={getTeamsForGame}
        onPick={handlePick}
        disabled={isDisabled}
        bracketPositions={bracketPositions}
        roundPointsMap={roundPointsMap}
      />

      {/* Tiebreaker + Submit */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1">
            <label
              htmlFor="tiebreaker"
              className="mb-1 block text-sm font-medium"
            >
              Tiebreaker: Predicted Championship Total Score
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Predict the combined score of both teams in the championship game.
              Used to break ties in the standings.
            </p>
            <Input
              id="tiebreaker"
              type="number"
              min={0}
              max={500}
              placeholder="e.g. 145"
              value={tiebreaker}
              onChange={(e) => setTiebreaker(e.target.value)}
              onBlur={handleTiebreakerBlur}
              disabled={isDisabled}
              className="w-32"
            />
          </div>
          {!isLocked && (
            <Button
              onClick={handleSubmit}
              disabled={!isComplete || isPending || isSubmitted}
            >
              {isPending ? "Submitting..." : "Submit Bracket"}
            </Button>
          )}
        </div>
        {!isComplete && !isDisabled && (
          <p className="mt-2 text-xs text-muted-foreground">
            {pickedGames < totalGames && `Pick all ${totalGames} games. `}
            {(tiebreakerValue === null || isNaN(tiebreakerValue)) &&
              "Enter a tiebreaker score. "}
          </p>
        )}
      </div>
    </div>
  );
}
