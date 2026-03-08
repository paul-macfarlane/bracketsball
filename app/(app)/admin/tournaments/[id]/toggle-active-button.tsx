"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleTournamentActiveAction } from "../actions";

interface ToggleActiveButtonProps {
  tournamentId: string;
  isActive: boolean;
}

export function ToggleActiveButton({
  tournamentId,
  isActive,
}: ToggleActiveButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleToggle() {
    setIsPending(true);
    try {
      await toggleTournamentActiveAction(tournamentId, !isActive);
      toast.success(
        isActive ? "Tournament deactivated" : "Tournament activated",
      );
    } catch {
      toast.error("Failed to update tournament");
    }
    setIsPending(false);
  }

  return (
    <Button
      variant={isActive ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isActive ? "Deactivate" : "Set Active"}
    </Button>
  );
}
