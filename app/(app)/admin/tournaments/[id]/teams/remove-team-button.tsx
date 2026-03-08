"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { removeTeamFromTournamentAction } from "../../actions";

interface RemoveTeamButtonProps {
  tournamentId: string;
  tournamentTeamId: string;
  teamName: string;
}

export function RemoveTeamButton({
  tournamentId,
  tournamentTeamId,
  teamName,
}: RemoveTeamButtonProps) {
  const [isPending, setIsPending] = useState(false);

  async function handleRemove() {
    setIsPending(true);
    const result = await removeTeamFromTournamentAction(
      tournamentId,
      tournamentTeamId,
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(`Removed ${teamName}`);
    }
    setIsPending(false);
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive"
      onClick={handleRemove}
      disabled={isPending}
    >
      Remove
    </Button>
  );
}
