"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TOURNAMENT_REGIONS,
  REGION_DISPLAY_NAMES,
} from "@/lib/validators/tournament";
import { updateBracketPositionsAction } from "../actions";

type Region = (typeof TOURNAMENT_REGIONS)[number];

interface BracketPositionsFormProps {
  tournamentId: string;
  initialPositions: {
    bracketTopLeftRegion: Region | null;
    bracketBottomLeftRegion: Region | null;
    bracketTopRightRegion: Region | null;
    bracketBottomRightRegion: Region | null;
  };
  disabled: boolean;
}

const POSITION_LABELS = {
  bracketTopLeftRegion: "Top Left",
  bracketBottomLeftRegion: "Bottom Left",
  bracketTopRightRegion: "Top Right",
  bracketBottomRightRegion: "Bottom Right",
} as const;

type PositionKey = keyof typeof POSITION_LABELS;

export function BracketPositionsForm({
  tournamentId,
  initialPositions,
  disabled,
}: BracketPositionsFormProps) {
  const [positions, setPositions] = useState(initialPositions);
  const [isPending, startTransition] = useTransition();

  const usedRegions = new Set(
    Object.values(positions).filter((v): v is Region => v !== null),
  );

  const allAssigned = usedRegions.size === 4;

  function handleChange(key: PositionKey, value: Region) {
    setPositions((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!allAssigned) return;

    startTransition(async () => {
      const result = await updateBracketPositionsAction(
        tournamentId,
        positions,
      );
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket positions updated");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bracket Region Positions</CardTitle>
        <CardDescription>
          Configure which region appears in each bracket position. Left-side
          regions play each other in the Final Four, and right-side regions play
          each other.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left side */}
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Left Side (FF Semifinal 1)
            </h4>
            <div className="space-y-3">
              {(
                [
                  "bracketTopLeftRegion",
                  "bracketBottomLeftRegion",
                ] as PositionKey[]
              ).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {POSITION_LABELS[key]}
                  </label>
                  <Select
                    value={positions[key] ?? ""}
                    onValueChange={(v) => handleChange(key, v as Region)}
                    disabled={disabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_REGIONS.map((region) => {
                        const isUsedElsewhere =
                          usedRegions.has(region) && positions[key] !== region;
                        return (
                          <SelectItem
                            key={region}
                            value={region}
                            disabled={isUsedElsewhere}
                          >
                            {REGION_DISPLAY_NAMES[region]}
                            {isUsedElsewhere ? " (used)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div>
            <h4 className="mb-2 text-sm font-medium">
              Right Side (FF Semifinal 2)
            </h4>
            <div className="space-y-3">
              {(
                [
                  "bracketTopRightRegion",
                  "bracketBottomRightRegion",
                ] as PositionKey[]
              ).map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-xs text-muted-foreground">
                    {POSITION_LABELS[key]}
                  </label>
                  <Select
                    value={positions[key] ?? ""}
                    onValueChange={(v) => handleChange(key, v as Region)}
                    disabled={disabled || isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOURNAMENT_REGIONS.map((region) => {
                        const isUsedElsewhere =
                          usedRegions.has(region) && positions[key] !== region;
                        return (
                          <SelectItem
                            key={region}
                            value={region}
                            disabled={isUsedElsewhere}
                          >
                            {REGION_DISPLAY_NAMES[region]}
                            {isUsedElsewhere ? " (used)" : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!allAssigned || disabled || isPending}
          className="mt-4"
        >
          {isPending ? "Saving..." : "Save Positions"}
        </Button>

        {disabled && (
          <p className="mt-2 text-xs text-muted-foreground">
            Bracket positions cannot be changed after games have started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
