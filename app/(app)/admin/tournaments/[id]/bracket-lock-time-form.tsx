"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  updateBracketLockTimeAction,
  resetBracketLockTimeAction,
} from "../actions";

interface BracketLockTimeFormProps {
  tournamentId: string;
  initialLockTime: string | null;
  isManual: boolean;
}

function toLocalDatetimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function BracketLockTimeForm({
  tournamentId,
  initialLockTime,
  isManual,
}: BracketLockTimeFormProps) {
  const [lockTime, setLockTime] = useState(
    initialLockTime ? toLocalDatetimeString(new Date(initialLockTime)) : "",
  );
  const [isPending, startTransition] = useTransition();

  const currentLockDate = initialLockTime ? new Date(initialLockTime) : null;
  const isLocked = currentLockDate ? new Date() >= currentLockDate : false;

  function handleSave() {
    startTransition(async () => {
      const isoTime = lockTime ? new Date(lockTime).toISOString() : null;
      const result = await updateBracketLockTimeAction(tournamentId, isoTime);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket lock time updated");
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      const result = await resetBracketLockTimeAction(tournamentId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Bracket lock time reset to auto-calculated value");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Bracket Lock Time</CardTitle>
          {isManual && <Badge variant="secondary">Manual Override</Badge>}
          {isLocked && <Badge variant="destructive">Locked</Badge>}
        </div>
        <CardDescription>
          Brackets will be locked for creation and editing once this time
          passes. Auto-calculated from the earliest Round of 64 game start time
          during ESPN sync.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentLockDate && (
          <p className="mb-3 text-sm text-muted-foreground">
            Current:{" "}
            <span className="font-medium text-foreground">
              {currentLockDate.toLocaleString()}
            </span>
          </p>
        )}
        {!currentLockDate && (
          <p className="mb-3 text-sm text-muted-foreground">
            Not set — will be auto-calculated when R64 game times are synced
            from ESPN.
          </p>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label
              htmlFor="lock-time"
              className="mb-1 block text-xs text-muted-foreground"
            >
              Override Lock Time
            </label>
            <Input
              id="lock-time"
              type="datetime-local"
              value={lockTime}
              onChange={(e) => setLockTime(e.target.value)}
              disabled={isPending}
            />
          </div>
          <Button onClick={handleSave} disabled={!lockTime || isPending}>
            {isPending ? "Saving..." : "Set"}
          </Button>
          {isManual && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset to Auto
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
