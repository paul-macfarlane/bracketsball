"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Satellite } from "lucide-react";

import { Button } from "@/components/ui/button";
import { syncFromESPNAction } from "./actions";

interface SyncESPNButtonProps {
  tournamentId: string;
}

export function SyncESPNButton({ tournamentId }: SyncESPNButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncFromESPNAction(tournamentId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `ESPN sync complete — ${result.gamesUpdated} games updated, ${result.teamsUpserted} teams upserted.`,
        );
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} warnings during sync`);
        }
      }
    });
  }

  return (
    <Button onClick={handleSync} disabled={isPending} variant="outline">
      <Satellite
        className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Syncing ESPN..." : "Sync from ESPN"}
    </Button>
  );
}
