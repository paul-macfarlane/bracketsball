"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { syncTeamStatsAction } from "./actions";

interface SyncTeamStatsButtonProps {
  tournamentId: string;
}

export function SyncTeamStatsButton({
  tournamentId,
}: SyncTeamStatsButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncTeamStatsAction(tournamentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Team stats synced — ${result.teamsUpdated} teams updated, ${result.teamsSkipped} skipped.`,
        );
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} warnings during sync`);
        }
      }
    });
  }

  return (
    <Button onClick={handleSync} disabled={isPending} variant="outline">
      <BarChart3
        className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Syncing Stats..." : "Sync Team Stats"}
    </Button>
  );
}
