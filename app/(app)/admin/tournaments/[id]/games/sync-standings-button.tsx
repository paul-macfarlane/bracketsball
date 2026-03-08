"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { syncStandingsAction } from "./actions";

interface SyncStandingsButtonProps {
  tournamentId: string;
}

export function SyncStandingsButton({
  tournamentId,
}: SyncStandingsButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncStandingsAction(tournamentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Standings synced — ${result.updatedCount} bracket entries updated.`,
        );
      }
    });
  }

  return (
    <Button onClick={handleSync} disabled={isPending} variant="outline">
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Syncing..." : "Sync Standings"}
    </Button>
  );
}
