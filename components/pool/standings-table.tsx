"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, ArrowUpDown, Trophy } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserDisplay } from "@/components/user-display";

export interface StandingsEntry {
  id: string;
  name: string;
  totalPoints: number;
  potentialPoints: number;
  userId: string;
  userName: string;
  userImage: string | null;
  userUsername: string | null;
  rank: number;
  championPick: {
    teamShortName: string;
    teamLogoUrl: string | null;
  } | null;
}

type SortField = "rank" | "points" | "potential";

interface StandingsTableProps {
  standings: StandingsEntry[];
  poolId: string;
}

export function StandingsTable({ standings, poolId }: StandingsTableProps) {
  const [sortField, setSortField] = useState<SortField>("rank");

  const sorted = useMemo(() => {
    if (sortField === "rank") return standings;
    return [...standings].sort((a, b) => {
      if (sortField === "points") return b.totalPoints - a.totalPoints;
      return b.potentialPoints - a.potentialPoints;
    });
  }, [standings, sortField]);

  function handleSort(field: SortField) {
    setSortField((prev) => (prev === field ? "rank" : field));
  }

  if (standings.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No brackets have been created yet.
      </p>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Bracket</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-16 text-center">Champ</TableHead>
              <TableHead className="w-20 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("points")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Pts
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="w-24 text-right">
                <button
                  type="button"
                  onClick={() => handleSort("potential")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  Potential
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {entry.rank}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/pools/${poolId}/brackets/${entry.id}`}
                    className="font-medium hover:underline"
                  >
                    {entry.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <UserDisplay
                    name={entry.userName}
                    image={entry.userImage}
                    username={entry.userUsername}
                    size="sm"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <ChampionDisplay championPick={entry.championPick} />
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {entry.totalPoints}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {entry.potentialPoints}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile list */}
      <div className="space-y-1 md:hidden">
        {sorted.map((entry) => (
          <Link
            key={entry.id}
            href={`/pools/${poolId}/brackets/${entry.id}`}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors active:bg-muted"
          >
            <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
              {entry.rank}
            </span>
            <ChampionDisplay championPick={entry.championPick} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{entry.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {entry.userName}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-semibold">{entry.totalPoints}</div>
              <div className="text-xs text-muted-foreground">
                {entry.potentialPoints}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </>
  );
}

function ChampionDisplay({
  championPick,
}: {
  championPick: StandingsEntry["championPick"];
}) {
  if (!championPick) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (championPick.teamLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={championPick.teamLogoUrl}
        alt={championPick.teamShortName}
        title={championPick.teamShortName}
        className="h-6 w-6 object-contain"
      />
    );
  }
  return <Trophy className="h-4 w-4 text-muted-foreground" />;
}
