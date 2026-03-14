"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  updateTournamentTeamStatsSchema,
  type UpdateTournamentTeamStatsFormValues,
} from "@/lib/validators/tournament";
import { updateTournamentTeamStatsAction } from "../../actions";

interface TeamStats {
  overallWins: number | null;
  overallLosses: number | null;
  conferenceWins: number | null;
  conferenceLosses: number | null;
  conferenceName: string | null;
  ppg: number | null;
  oppPpg: number | null;
  fgPct: number | null;
  threePtPct: number | null;
  ftPct: number | null;
  reboundsPerGame: number | null;
  assistsPerGame: number | null;
  stealsPerGame: number | null;
  blocksPerGame: number | null;
  turnoversPerGame: number | null;
  apRanking: number | null;
  strengthOfSchedule: number | null;
}

interface EditTeamStatsButtonProps {
  tournamentId: string;
  tournamentTeamId: string;
  teamName: string;
  currentStats: TeamStats;
}

function numToStr(value: number | null | undefined): string {
  return value !== null && value !== undefined ? String(value) : "";
}

export function EditTeamStatsButton({
  tournamentId,
  tournamentTeamId,
  teamName,
  currentStats,
}: EditTeamStatsButtonProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, formState } =
    useForm<UpdateTournamentTeamStatsFormValues>({
      resolver: zodResolver(updateTournamentTeamStatsSchema),
      defaultValues: {
        overallWins: currentStats.overallWins,
        overallLosses: currentStats.overallLosses,
        conferenceWins: currentStats.conferenceWins,
        conferenceLosses: currentStats.conferenceLosses,
        conferenceName: currentStats.conferenceName,
        ppg: currentStats.ppg,
        oppPpg: currentStats.oppPpg,
        fgPct: currentStats.fgPct,
        threePtPct: currentStats.threePtPct,
        ftPct: currentStats.ftPct,
        reboundsPerGame: currentStats.reboundsPerGame,
        assistsPerGame: currentStats.assistsPerGame,
        stealsPerGame: currentStats.stealsPerGame,
        blocksPerGame: currentStats.blocksPerGame,
        turnoversPerGame: currentStats.turnoversPerGame,
        apRanking: currentStats.apRanking,
        strengthOfSchedule: currentStats.strengthOfSchedule,
      },
    });

  const intField = (name: keyof UpdateTournamentTeamStatsFormValues) =>
    register(name, {
      setValueAs: (v: string) => {
        if (v === "" || v === undefined) return null;
        const n = parseInt(v, 10);
        return isNaN(n) ? null : n;
      },
    });

  const floatField = (name: keyof UpdateTournamentTeamStatsFormValues) =>
    register(name, {
      setValueAs: (v: string) => {
        if (v === "" || v === undefined) return null;
        const n = parseFloat(v);
        return isNaN(n) ? null : n;
      },
    });

  const strField = (name: keyof UpdateTournamentTeamStatsFormValues) =>
    register(name, {
      setValueAs: (v: string) => v || null,
    });

  async function onSubmit(data: UpdateTournamentTeamStatsFormValues) {
    const result = await updateTournamentTeamStatsAction(
      tournamentId,
      tournamentTeamId,
      data,
    );
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Team stats updated");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Edit stats">
          <BarChart3 className="h-4 w-4" />
          <span className="sr-only">Stats</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Stats — {teamName}</DialogTitle>
          <DialogDescription>
            Update team statistics. Empty fields will be saved as blank.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Records Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Records
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor="overallWins" className="mb-1 text-xs">
                  Overall W
                </Label>
                <Input
                  id="overallWins"
                  type="number"
                  min={0}
                  step={1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.overallWins)}
                  {...intField("overallWins")}
                />
              </div>
              <div>
                <Label htmlFor="overallLosses" className="mb-1 text-xs">
                  Overall L
                </Label>
                <Input
                  id="overallLosses"
                  type="number"
                  min={0}
                  step={1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.overallLosses)}
                  {...intField("overallLosses")}
                />
              </div>
              <div>
                <Label htmlFor="conferenceWins" className="mb-1 text-xs">
                  Conf W
                </Label>
                <Input
                  id="conferenceWins"
                  type="number"
                  min={0}
                  step={1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.conferenceWins)}
                  {...intField("conferenceWins")}
                />
              </div>
              <div>
                <Label htmlFor="conferenceLosses" className="mb-1 text-xs">
                  Conf L
                </Label>
                <Input
                  id="conferenceLosses"
                  type="number"
                  min={0}
                  step={1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.conferenceLosses)}
                  {...intField("conferenceLosses")}
                />
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="conferenceName" className="mb-1 text-xs">
                Conference Name
              </Label>
              <Input
                id="conferenceName"
                type="text"
                className="h-8"
                defaultValue={currentStats.conferenceName ?? ""}
                {...strField("conferenceName")}
              />
            </div>
          </div>

          {/* Scoring Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Scoring
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ppg" className="mb-1 text-xs">
                  PPG
                </Label>
                <Input
                  id="ppg"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.ppg)}
                  {...floatField("ppg")}
                />
              </div>
              <div>
                <Label htmlFor="oppPpg" className="mb-1 text-xs">
                  Opp PPG
                </Label>
                <Input
                  id="oppPpg"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.oppPpg)}
                  {...floatField("oppPpg")}
                />
              </div>
            </div>
          </div>

          {/* Shooting Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Shooting
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="fgPct" className="mb-1 text-xs">
                  FG%
                </Label>
                <Input
                  id="fgPct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.fgPct)}
                  {...floatField("fgPct")}
                />
              </div>
              <div>
                <Label htmlFor="threePtPct" className="mb-1 text-xs">
                  3PT%
                </Label>
                <Input
                  id="threePtPct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.threePtPct)}
                  {...floatField("threePtPct")}
                />
              </div>
              <div>
                <Label htmlFor="ftPct" className="mb-1 text-xs">
                  FT%
                </Label>
                <Input
                  id="ftPct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.ftPct)}
                  {...floatField("ftPct")}
                />
              </div>
            </div>
          </div>

          {/* Per Game Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Per Game
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <Label htmlFor="reboundsPerGame" className="mb-1 text-xs">
                  RPG
                </Label>
                <Input
                  id="reboundsPerGame"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.reboundsPerGame)}
                  {...floatField("reboundsPerGame")}
                />
              </div>
              <div>
                <Label htmlFor="assistsPerGame" className="mb-1 text-xs">
                  APG
                </Label>
                <Input
                  id="assistsPerGame"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.assistsPerGame)}
                  {...floatField("assistsPerGame")}
                />
              </div>
              <div>
                <Label htmlFor="stealsPerGame" className="mb-1 text-xs">
                  SPG
                </Label>
                <Input
                  id="stealsPerGame"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.stealsPerGame)}
                  {...floatField("stealsPerGame")}
                />
              </div>
              <div>
                <Label htmlFor="blocksPerGame" className="mb-1 text-xs">
                  BPG
                </Label>
                <Input
                  id="blocksPerGame"
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.blocksPerGame)}
                  {...floatField("blocksPerGame")}
                />
              </div>
            </div>
            <div className="mt-3 w-1/2 sm:w-1/4">
              <Label htmlFor="turnoversPerGame" className="mb-1 text-xs">
                TOPG
              </Label>
              <Input
                id="turnoversPerGame"
                type="number"
                min={0}
                step={0.1}
                className="h-8"
                defaultValue={numToStr(currentStats.turnoversPerGame)}
                {...floatField("turnoversPerGame")}
              />
            </div>
          </div>

          {/* Rankings Section */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Rankings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apRanking" className="mb-1 text-xs">
                  AP Ranking
                </Label>
                <Input
                  id="apRanking"
                  type="number"
                  min={1}
                  max={25}
                  step={1}
                  className="h-8"
                  defaultValue={numToStr(currentStats.apRanking)}
                  {...intField("apRanking")}
                />
              </div>
              <div>
                <Label htmlFor="strengthOfSchedule" className="mb-1 text-xs">
                  SOS
                </Label>
                <Input
                  id="strengthOfSchedule"
                  type="number"
                  step={0.001}
                  className="h-8"
                  defaultValue={numToStr(currentStats.strengthOfSchedule)}
                  {...floatField("strengthOfSchedule")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Saving..." : "Save Stats"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
