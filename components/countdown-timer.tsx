"use client";

import { useEffect, useState } from "react";
import { Clock, Lock } from "lucide-react";

interface CountdownTimerProps {
  lockTime: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function getTimeRemaining(lockTime: string): TimeRemaining {
  const total = new Date(lockTime).getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export function CountdownTimer({ lockTime }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    getTimeRemaining(lockTime),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(lockTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [lockTime]);

  if (timeRemaining.total <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
        <Lock className="h-4 w-4" />
        Brackets are locked
      </div>
    );
  }

  const parts: string[] = [];
  if (timeRemaining.days > 0) parts.push(`${timeRemaining.days}d`);
  if (timeRemaining.hours > 0 || timeRemaining.days > 0)
    parts.push(`${timeRemaining.hours}h`);
  parts.push(`${timeRemaining.minutes}m`);
  parts.push(`${timeRemaining.seconds}s`);

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium">
      <Clock className="h-4 w-4" />
      <span>Brackets lock in {parts.join(" ")}</span>
    </div>
  );
}
