"use client";

import { useState, useTransition } from "react";
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
  updateTiebreakerAction,
  submitBracketAction,
  deleteBracketEntryAction,
} from "@/app/(app)/pools/[id]/brackets/actions";

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
}: BracketEditorProps) {
  const router = useRouter();
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
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{bracketName}</h1>
          <Badge variant={isSubmitted ? "default" : "secondary"}>
            {isSubmitted ? "Submitted" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {pickedGames}/{totalGames} picks
          </span>
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
                  This will permanently delete &quot;{bracketName}&quot; and all
                  its picks. This cannot be undone.
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
        </div>
      </div>

      {/* Bracket view */}
      <BracketFullView
        games={games}
        picks={picks}
        getTeamsForGame={getTeamsForGame}
        onPick={handlePick}
        disabled={isSubmitted}
        bracketPositions={bracketPositions}
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
              disabled={isSubmitted}
              className="w-32"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!isComplete || isPending || isSubmitted}
          >
            {isPending
              ? "Submitting..."
              : isSubmitted
                ? "Submitted"
                : "Submit Bracket"}
          </Button>
        </div>
        {!isComplete && !isSubmitted && (
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
