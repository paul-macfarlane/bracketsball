"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TOURNAMENT_REGIONS,
  REGION_DISPLAY_NAMES,
} from "@/lib/validators/tournament";
import { updateTournamentTeamAction } from "../../actions";

interface EditTeamButtonProps {
  tournamentId: string;
  tournamentTeamId: string;
  currentSeed: number;
  currentRegion: "south" | "east" | "west" | "midwest";
}

export function EditTeamButton({
  tournamentId,
  tournamentTeamId,
  currentSeed,
  currentRegion,
}: EditTeamButtonProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [seed, setSeed] = useState(currentSeed);
  const [region, setRegion] = useState(currentRegion);

  async function handleSave() {
    setIsPending(true);
    const result = await updateTournamentTeamAction(
      tournamentId,
      tournamentTeamId,
      { seed, region },
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Team updated");
      setIsEditing(false);
    }
    setIsPending(false);
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={16}
          value={seed}
          onChange={(e) => setSeed(e.target.valueAsNumber)}
          className="h-7 w-16"
        />
        <Select
          value={region}
          onValueChange={(v) => setRegion(v as typeof region)}
        >
          <SelectTrigger className="h-7 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOURNAMENT_REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {REGION_DISPLAY_NAMES[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="default"
          onClick={handleSave}
          disabled={isPending}
          className="h-7"
        >
          {isPending ? "..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSeed(currentSeed);
            setRegion(currentRegion);
            setIsEditing(false);
          }}
          className="h-7"
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
      Edit
    </Button>
  );
}
