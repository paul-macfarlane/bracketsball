"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { BracketTeam, TeamStats } from "./types";

interface TeamComparisonProps {
  team1: BracketTeam;
  team2: BracketTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startTime?: Date | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueState?: string | null;
}

type StatDirection = "higher" | "lower";

interface StatRowProps {
  label: string;
  value1: string | null;
  value2: string | null;
  raw1: number | null | undefined;
  raw2: number | null | undefined;
  better?: StatDirection;
}

function StatRow({ label, value1, value2, raw1, raw2, better }: StatRowProps) {
  const has1 = raw1 != null;
  const has2 = raw2 != null;
  const hasBoth = has1 && has2;

  let highlight1 = false;
  let highlight2 = false;

  if (hasBoth && better) {
    if (better === "higher") {
      highlight1 = raw1! > raw2!;
      highlight2 = raw2! > raw1!;
    } else {
      highlight1 = raw1! < raw2!;
      highlight2 = raw2! < raw1!;
    }
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 text-sm">
      <span
        className={cn(
          "text-right tabular-nums",
          highlight1 && "font-semibold text-success",
        )}
      >
        {value1 ?? "—"}
      </span>
      <span className="min-w-[7rem] text-center text-xs text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "text-left tabular-nums",
          highlight2 && "font-semibold text-success",
        )}
      >
        {value2 ?? "—"}
      </span>
    </div>
  );
}

function formatPct(value: number | null | undefined): string | null {
  if (value == null) return null;
  return `${value.toFixed(1)}%`;
}

function formatNum(
  value: number | null | undefined,
  decimals = 1,
): string | null {
  if (value == null) return null;
  return value.toFixed(decimals);
}

function formatRecord(
  wins: number | null | undefined,
  losses: number | null | undefined,
): string | null {
  if (wins == null || losses == null) return null;
  return `${wins}-${losses}`;
}

function winPct(
  wins: number | null | undefined,
  losses: number | null | undefined,
): number | null {
  if (wins == null || losses == null) return null;
  const total = wins + losses;
  if (total === 0) return null;
  return wins / total;
}

function hasAnyStats(stats?: TeamStats): boolean {
  if (!stats) return false;
  return (
    stats.overallWins != null ||
    stats.ppg != null ||
    stats.fgPct != null ||
    stats.apRanking != null
  );
}

export function TeamComparison({
  team1,
  team2,
  open,
  onOpenChange,
  startTime,
  venueName,
  venueCity,
  venueState,
}: TeamComparisonProps) {
  const s1 = team1.stats;
  const s2 = team2.stats;
  const hasStats = hasAnyStats(s1) || hasAnyStats(s2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Matchup Details</DialogTitle>
        </DialogHeader>

        {/* Team Headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-1 text-center">
            {team1.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team1.logoUrl}
                alt={team1.abbreviation}
                className="h-12 w-12 object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">
              #{team1.seed} seed
            </span>
            <span className="font-semibold">{team1.shortName}</span>
            {s1?.conferenceName && (
              <span className="text-xs text-muted-foreground">
                {s1.conferenceName}
              </span>
            )}
            {s1?.apRanking && (
              <span className="text-xs font-medium">AP #{s1.apRanking}</span>
            )}
          </div>
          <span className="text-lg font-bold text-muted-foreground">vs</span>
          <div className="flex flex-col items-center gap-1 text-center">
            {team2.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team2.logoUrl}
                alt={team2.abbreviation}
                className="h-12 w-12 object-contain"
              />
            )}
            <span className="text-xs text-muted-foreground">
              #{team2.seed} seed
            </span>
            <span className="font-semibold">{team2.shortName}</span>
            {s2?.conferenceName && (
              <span className="text-xs text-muted-foreground">
                {s2.conferenceName}
              </span>
            )}
            {s2?.apRanking && (
              <span className="text-xs font-medium">AP #{s2.apRanking}</span>
            )}
          </div>
        </div>

        {/* Game Info */}
        {(startTime || venueName) && (
          <div className="rounded-md bg-muted/50 p-3 text-center text-sm">
            {startTime && (
              <div>
                {new Date(startTime).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}{" "}
                at{" "}
                {new Date(startTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            )}
            {venueName && (
              <div className="text-muted-foreground">
                {venueName}
                {venueCity && venueState && ` — ${venueCity}, ${venueState}`}
              </div>
            )}
          </div>
        )}

        {/* Stats Comparison */}
        {hasStats ? (
          <div className="space-y-1">
            <div className="mb-2 border-b pb-1 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Season Stats
            </div>

            <StatRow
              label="Record"
              value1={formatRecord(s1?.overallWins, s1?.overallLosses)}
              value2={formatRecord(s2?.overallWins, s2?.overallLosses)}
              raw1={winPct(s1?.overallWins, s1?.overallLosses)}
              raw2={winPct(s2?.overallWins, s2?.overallLosses)}
              better="higher"
            />
            {(s1?.conferenceWins != null || s2?.conferenceWins != null) && (
              <StatRow
                label="Conf Record"
                value1={formatRecord(s1?.conferenceWins, s1?.conferenceLosses)}
                value2={formatRecord(s2?.conferenceWins, s2?.conferenceLosses)}
                raw1={winPct(s1?.conferenceWins, s1?.conferenceLosses)}
                raw2={winPct(s2?.conferenceWins, s2?.conferenceLosses)}
                better="higher"
              />
            )}

            <div className="my-1 border-t" />

            <StatRow
              label="PPG"
              value1={formatNum(s1?.ppg)}
              value2={formatNum(s2?.ppg)}
              raw1={s1?.ppg}
              raw2={s2?.ppg}
              better="higher"
            />
            <StatRow
              label="Opp PPG"
              value1={formatNum(s1?.oppPpg)}
              value2={formatNum(s2?.oppPpg)}
              raw1={s1?.oppPpg}
              raw2={s2?.oppPpg}
              better="lower"
            />

            <div className="my-1 border-t" />

            <StatRow
              label="FG%"
              value1={formatPct(s1?.fgPct)}
              value2={formatPct(s2?.fgPct)}
              raw1={s1?.fgPct}
              raw2={s2?.fgPct}
              better="higher"
            />
            <StatRow
              label="3PT%"
              value1={formatPct(s1?.threePtPct)}
              value2={formatPct(s2?.threePtPct)}
              raw1={s1?.threePtPct}
              raw2={s2?.threePtPct}
              better="higher"
            />
            <StatRow
              label="FT%"
              value1={formatPct(s1?.ftPct)}
              value2={formatPct(s2?.ftPct)}
              raw1={s1?.ftPct}
              raw2={s2?.ftPct}
              better="higher"
            />

            <div className="my-1 border-t" />

            <StatRow
              label="RPG"
              value1={formatNum(s1?.reboundsPerGame)}
              value2={formatNum(s2?.reboundsPerGame)}
              raw1={s1?.reboundsPerGame}
              raw2={s2?.reboundsPerGame}
              better="higher"
            />
            <StatRow
              label="APG"
              value1={formatNum(s1?.assistsPerGame)}
              value2={formatNum(s2?.assistsPerGame)}
              raw1={s1?.assistsPerGame}
              raw2={s2?.assistsPerGame}
              better="higher"
            />
            <StatRow
              label="SPG"
              value1={formatNum(s1?.stealsPerGame)}
              value2={formatNum(s2?.stealsPerGame)}
              raw1={s1?.stealsPerGame}
              raw2={s2?.stealsPerGame}
              better="higher"
            />
            <StatRow
              label="BPG"
              value1={formatNum(s1?.blocksPerGame)}
              value2={formatNum(s2?.blocksPerGame)}
              raw1={s1?.blocksPerGame}
              raw2={s2?.blocksPerGame}
              better="higher"
            />
            <StatRow
              label="TOPG"
              value1={formatNum(s1?.turnoversPerGame)}
              value2={formatNum(s2?.turnoversPerGame)}
              raw1={s1?.turnoversPerGame}
              raw2={s2?.turnoversPerGame}
              better="lower"
            />

            {(s1?.strengthOfSchedule != null ||
              s2?.strengthOfSchedule != null) && (
              <>
                <div className="my-1 border-t" />
                <StatRow
                  label="SOS"
                  value1={formatNum(s1?.strengthOfSchedule, 2)}
                  value2={formatNum(s2?.strengthOfSchedule, 2)}
                  raw1={s1?.strengthOfSchedule}
                  raw2={s2?.strengthOfSchedule}
                  better="higher"
                />
              </>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            No team stats available yet. Stats will appear once synced.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
