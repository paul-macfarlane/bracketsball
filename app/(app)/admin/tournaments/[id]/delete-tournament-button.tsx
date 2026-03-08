"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { deleteTournamentAction } from "../actions";

interface DeleteTournamentButtonProps {
  tournamentId: string;
  tournamentName: string;
}

export function DeleteTournamentButton({
  tournamentId,
  tournamentName,
}: DeleteTournamentButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    try {
      await deleteTournamentAction(tournamentId);
      toast.success(`Deleted ${tournamentName}`);
    } catch {
      toast.error("Failed to delete tournament");
    }
    setIsPending(false);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {tournamentName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this tournament, all team assignments,
            and all game data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
