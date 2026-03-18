"use client";

import { useRef, useState } from "react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  updateTournamentTeamStatsSchema,
  type UpdateTournamentTeamStatsFormValues,
} from "@/lib/validators/tournament";
import { updateTournamentTeamStatsAction } from "../../actions";

interface EditTeamStatsButtonProps {
  tournamentId: string;
  tournamentTeamId: string;
  teamName: string;
  currentStats: {
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
    strengthOfScheduleRank: number | null;
    strengthOfRecord: number | null;
    strengthOfRecordRank: number | null;
    bpi: number | null;
    bpiOffense: number | null;
    bpiDefense: number | null;
    bpiRank: number | null;
    bpiOffenseRank: number | null;
    bpiDefenseRank: number | null;
  };
}

function numericSetValueAs(v: string) {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function EditTeamStatsButton({
  tournamentId,
  tournamentTeamId,
  teamName,
  currentStats,
}: EditTeamStatsButtonProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UpdateTournamentTeamStatsFormValues>({
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
      strengthOfScheduleRank: currentStats.strengthOfScheduleRank,
      strengthOfRecord: currentStats.strengthOfRecord,
      strengthOfRecordRank: currentStats.strengthOfRecordRank,
      bpi: currentStats.bpi,
      bpiOffense: currentStats.bpiOffense,
      bpiDefense: currentStats.bpiDefense,
      bpiRank: currentStats.bpiRank,
      bpiOffenseRank: currentStats.bpiOffenseRank,
      bpiDefenseRank: currentStats.bpiDefenseRank,
    },
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
        <Button variant="ghost" size="sm" title="Edit Stats">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Stats — {teamName}</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div>
            <h3 className="mb-2 text-sm font-semibold">Records</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="overallWins">Overall Wins</Label>
                <Input
                  id="overallWins"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={currentStats.overallWins ?? ""}
                  {...register("overallWins", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="overallLosses">Overall Losses</Label>
                <Input
                  id="overallLosses"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={currentStats.overallLosses ?? ""}
                  {...register("overallLosses", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="conferenceWins">Conference Wins</Label>
                <Input
                  id="conferenceWins"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={currentStats.conferenceWins ?? ""}
                  {...register("conferenceWins", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="conferenceLosses">Conference Losses</Label>
                <Input
                  id="conferenceLosses"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={currentStats.conferenceLosses ?? ""}
                  {...register("conferenceLosses", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="conferenceName">Conference Name</Label>
                <Input
                  id="conferenceName"
                  type="text"
                  defaultValue={currentStats.conferenceName ?? ""}
                  {...register("conferenceName", {
                    setValueAs: (v: string) => (v === "" ? null : v),
                  })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Scoring</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ppg">PPG</Label>
                <Input
                  id="ppg"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.ppg ?? ""}
                  {...register("ppg", { setValueAs: numericSetValueAs })}
                />
              </div>
              <div>
                <Label htmlFor="oppPpg">Opp PPG</Label>
                <Input
                  id="oppPpg"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.oppPpg ?? ""}
                  {...register("oppPpg", { setValueAs: numericSetValueAs })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Shooting</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="fgPct">FG%</Label>
                <Input
                  id="fgPct"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  defaultValue={currentStats.fgPct ?? ""}
                  {...register("fgPct", { setValueAs: numericSetValueAs })}
                />
              </div>
              <div>
                <Label htmlFor="threePtPct">3PT%</Label>
                <Input
                  id="threePtPct"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  defaultValue={currentStats.threePtPct ?? ""}
                  {...register("threePtPct", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="ftPct">FT%</Label>
                <Input
                  id="ftPct"
                  type="number"
                  min={0}
                  max={100}
                  step="any"
                  defaultValue={currentStats.ftPct ?? ""}
                  {...register("ftPct", { setValueAs: numericSetValueAs })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Per Game</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="reboundsPerGame">RPG</Label>
                <Input
                  id="reboundsPerGame"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.reboundsPerGame ?? ""}
                  {...register("reboundsPerGame", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="assistsPerGame">APG</Label>
                <Input
                  id="assistsPerGame"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.assistsPerGame ?? ""}
                  {...register("assistsPerGame", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="stealsPerGame">SPG</Label>
                <Input
                  id="stealsPerGame"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.stealsPerGame ?? ""}
                  {...register("stealsPerGame", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="blocksPerGame">BPG</Label>
                <Input
                  id="blocksPerGame"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.blocksPerGame ?? ""}
                  {...register("blocksPerGame", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="turnoversPerGame">TOPG</Label>
                <Input
                  id="turnoversPerGame"
                  type="number"
                  min={0}
                  step="any"
                  defaultValue={currentStats.turnoversPerGame ?? ""}
                  {...register("turnoversPerGame", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Rankings & Strength</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apRanking">AP Ranking</Label>
                <Input
                  id="apRanking"
                  type="number"
                  min={1}
                  max={25}
                  step={1}
                  defaultValue={currentStats.apRanking ?? ""}
                  {...register("apRanking", { setValueAs: numericSetValueAs })}
                />
              </div>
              <div>
                <Label htmlFor="strengthOfSchedule">SOS</Label>
                <Input
                  id="strengthOfSchedule"
                  type="number"
                  step="any"
                  defaultValue={currentStats.strengthOfSchedule ?? ""}
                  {...register("strengthOfSchedule", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="strengthOfScheduleRank">SOS Rank</Label>
                <Input
                  id="strengthOfScheduleRank"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={currentStats.strengthOfScheduleRank ?? ""}
                  {...register("strengthOfScheduleRank", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="strengthOfRecord">SOR</Label>
                <Input
                  id="strengthOfRecord"
                  type="number"
                  step="any"
                  defaultValue={currentStats.strengthOfRecord ?? ""}
                  {...register("strengthOfRecord", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="strengthOfRecordRank">SOR Rank</Label>
                <Input
                  id="strengthOfRecordRank"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={currentStats.strengthOfRecordRank ?? ""}
                  {...register("strengthOfRecordRank", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">BPI</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="bpi">BPI</Label>
                <Input
                  id="bpi"
                  type="number"
                  step="any"
                  defaultValue={currentStats.bpi ?? ""}
                  {...register("bpi", { setValueAs: numericSetValueAs })}
                />
              </div>
              <div>
                <Label htmlFor="bpiOffense">BPI Off</Label>
                <Input
                  id="bpiOffense"
                  type="number"
                  step="any"
                  defaultValue={currentStats.bpiOffense ?? ""}
                  {...register("bpiOffense", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="bpiDefense">BPI Def</Label>
                <Input
                  id="bpiDefense"
                  type="number"
                  step="any"
                  defaultValue={currentStats.bpiDefense ?? ""}
                  {...register("bpiDefense", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="bpiRank">BPI Rank</Label>
                <Input
                  id="bpiRank"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={currentStats.bpiRank ?? ""}
                  {...register("bpiRank", { setValueAs: numericSetValueAs })}
                />
              </div>
              <div>
                <Label htmlFor="bpiOffenseRank">BPI Off Rank</Label>
                <Input
                  id="bpiOffenseRank"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={currentStats.bpiOffenseRank ?? ""}
                  {...register("bpiOffenseRank", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="bpiDefenseRank">BPI Def Rank</Label>
                <Input
                  id="bpiDefenseRank"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={currentStats.bpiDefenseRank ?? ""}
                  {...register("bpiDefenseRank", {
                    setValueAs: numericSetValueAs,
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Stats"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
