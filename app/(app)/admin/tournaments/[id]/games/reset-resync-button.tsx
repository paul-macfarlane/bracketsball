"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

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
import { resetAndResyncAction } from "./actions";

interface ResetResyncButtonProps {
  tournamentId: string;
}

export function ResetResyncButton({ tournamentId }: ResetResyncButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleResync() {
    startTransition(async () => {
      const result = await resetAndResyncAction(tournamentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Reset & re-sync complete — ${result.gamesUpdated} games updated.`,
        );
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} warnings during sync`);
        }
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} variant="outline">
          <RotateCcw
            className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
          />
          {isPending ? "Resetting..." : "Reset & Re-sync"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset ESPN mappings and re-sync?</AlertDialogTitle>
          <AlertDialogDescription>
            This clears all ESPN event ID mappings and game data, then re-syncs
            the full tournament from ESPN. Use this to fix mismatched game data
            from earlier sync issues. This is safe — bracket picks are not
            affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleResync}>
            Reset & Re-sync
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
