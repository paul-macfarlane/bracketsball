"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateGameAction } from "../../actions";

interface TeamInfo {
  name: string;
  seed: number;
  logoUrl: string | null;
}

interface GameRowProps {
  game: {
    id: string;
    gameNumber: number;
    team1Id: string | null;
    team2Id: string | null;
    team1Score: number | null;
    team2Score: number | null;
    winnerTeamId: string | null;
    status: "scheduled" | "in_progress" | "final";
    startTime: Date | null;
    venueName: string | null;
    venueCity: string | null;
    venueState: string | null;
  };
  team1: TeamInfo | null;
  team2: TeamInfo | null;
  region: string | null;
  tournamentId: string;
}

const STATUS_COLORS = {
  scheduled: "secondary",
  in_progress: "default",
  final: "outline",
} as const;

function formatDateTimeLocal(date: Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function GameRow({
  game,
  team1,
  team2,
  region,
  tournamentId,
}: GameRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [team1Score, setTeam1Score] = useState(
    game.team1Score?.toString() ?? "",
  );
  const [team2Score, setTeam2Score] = useState(
    game.team2Score?.toString() ?? "",
  );
  const [status, setStatus] = useState(game.status);
  const [startTime, setStartTime] = useState(
    formatDateTimeLocal(game.startTime),
  );
  const [venueName, setVenueName] = useState(game.venueName ?? "");
  const [venueCity, setVenueCity] = useState(game.venueCity ?? "");
  const [venueState, setVenueState] = useState(game.venueState ?? "");

  async function handleSave() {
    setIsPending(true);

    const result = await updateGameAction(game.id, tournamentId, {
      team1Score: team1Score ? parseInt(team1Score, 10) : null,
      team2Score: team2Score ? parseInt(team2Score, 10) : null,
      status,
      startTime: startTime || null,
      venueName: venueName || null,
      venueCity: venueCity || null,
      venueState: venueState || null,
    });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Game updated");
      setIsEditing(false);
    }
    setIsPending(false);
  }

  function renderTeam(teamInfo: TeamInfo | null, teamId: string | null) {
    if (!teamInfo) return <span className="text-muted-foreground">TBD</span>;
    return (
      <span className="flex items-center gap-1.5">
        {teamInfo.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={teamInfo.logoUrl} alt={teamInfo.name} className="h-4 w-4" />
        )}
        <span className="font-mono text-xs text-muted-foreground">
          ({teamInfo.seed})
        </span>
        <span className={game.winnerTeamId === teamId ? "font-bold" : ""}>
          {teamInfo.name}
        </span>
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {region && <span>{region}</span>}
          <span>Game {game.gameNumber}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium">
              {team1?.name ?? "TBD"} Score
            </label>
            <Input
              type="number"
              min={0}
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              className="h-8"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">
              {team2?.name ?? "TBD"} Score
            </label>
            <Input
              type="number"
              min={0}
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Status</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as typeof status)}
          >
            <SelectTrigger className="h-8 w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="border-t pt-3">
          <label className="mb-2 block text-xs font-semibold text-muted-foreground">
            Game Details
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium">
                Start Time
              </label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Venue Name
              </label>
              <Input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="h-8"
                placeholder="e.g. Lucas Oil Stadium"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Venue City
              </label>
              <Input
                type="text"
                value={venueCity}
                onChange={(e) => setVenueCity(e.target.value)}
                className="h-8"
                placeholder="e.g. Indianapolis"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Venue State
              </label>
              <Input
                type="text"
                value={venueState}
                onChange={(e) => setVenueState(e.target.value)}
                className="h-8"
                placeholder="e.g. IN"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-3">
            {renderTeam(team1, game.team1Id)}
            {game.team1Score !== null && (
              <span className="font-mono font-bold">{game.team1Score}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {renderTeam(team2, game.team2Id)}
            {game.team2Score !== null && (
              <span className="font-mono font-bold">{game.team2Score}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {region && (
          <span className="text-xs text-muted-foreground">{region}</span>
        )}
        <Badge variant={STATUS_COLORS[game.status]}>{game.status}</Badge>
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
      </div>
    </div>
  );
}
