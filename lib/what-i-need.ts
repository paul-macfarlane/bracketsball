import { getPointsForRound, type PoolScoring } from "@/lib/scoring";
import { ROUND_ORDER, ROUND_LABELS } from "@/components/bracket/types";

export interface WhatINeedTeamInfo {
  teamId: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
  score: number | null;
}

export interface WhatINeedGame {
  gameId: string;
  round: string;
  status: "scheduled" | "in_progress";
  statusDetail: string | null;
  startTime: string | null;
  team1: WhatINeedTeamInfo | null;
  team2: WhatINeedTeamInfo | null;
  team1Impact: number;
  team2Impact: number;
  team1FurthestRound: string | null;
  team2FurthestRound: string | null;
  team1Eliminated: boolean;
  team2Eliminated: boolean;
  rootFor: "team1" | "team2" | "both" | "none";
  totalImpact: number;
}

export interface WhatINeedRoundGroup {
  round: string;
  roundLabel: string;
  games: WhatINeedGame[];
}

interface GameInput {
  id: string;
  round: string;
  status: string;
  startTime: Date | string | null;
  team1Id: string | null;
  team2Id: string | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerTeamId: string | null;
  statusDetail?: string | null;
}

interface PickInput {
  tournamentGameId: string;
  pickedTeamId: string;
}

interface TeamMapEntry {
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
}

const roundIndex = new Map<string, number>(ROUND_ORDER.map((r, i) => [r, i]));

export function computeWhatINeed(
  games: GameInput[],
  picks: PickInput[],
  poolScoring: PoolScoring,
  teamMap: Map<string, TeamMapEntry>,
): WhatINeedRoundGroup[] {
  // Build eliminated teams set
  const eliminatedTeams = new Set<string>();
  for (const game of games) {
    if (game.status === "final" && game.winnerTeamId) {
      if (game.team1Id && game.team1Id !== game.winnerTeamId) {
        eliminatedTeams.add(game.team1Id);
      }
      if (game.team2Id && game.team2Id !== game.winnerTeamId) {
        eliminatedTeams.add(game.team2Id);
      }
    }
  }

  // Build picksByTeam: Map<teamId, { gameId, round }[]>
  const gameRoundMap = new Map(games.map((g) => [g.id, g.round]));
  const picksByTeam = new Map<string, { gameId: string; round: string }[]>();
  for (const pick of picks) {
    const round = gameRoundMap.get(pick.tournamentGameId);
    if (!round) continue;
    const list = picksByTeam.get(pick.pickedTeamId) ?? [];
    list.push({ gameId: pick.tournamentGameId, round });
    picksByTeam.set(pick.pickedTeamId, list);
  }

  // Process non-final games where both teams are known
  const resultGames: WhatINeedGame[] = [];

  for (const game of games) {
    if (game.status !== "scheduled" && game.status !== "in_progress") continue;
    if (!game.team1Id || !game.team2Id) continue;

    const gameRoundIdx = roundIndex.get(game.round) ?? -1;

    const computeImpact = (
      teamId: string,
    ): { impact: number; furthestRound: string | null } => {
      if (eliminatedTeams.has(teamId))
        return { impact: 0, furthestRound: null };
      const teamPicks = picksByTeam.get(teamId) ?? [];
      let impact = 0;
      let furthestRoundIdx = -1;
      let furthestRound: string | null = null;
      for (const pick of teamPicks) {
        const pickRoundIdx = roundIndex.get(pick.round) ?? -1;
        if (pickRoundIdx >= gameRoundIdx) {
          impact += getPointsForRound(pick.round, poolScoring);
          if (pickRoundIdx > furthestRoundIdx) {
            furthestRoundIdx = pickRoundIdx;
            furthestRound = pick.round;
          }
        }
      }
      return { impact, furthestRound };
    };

    const t1 = computeImpact(game.team1Id);
    const t2 = computeImpact(game.team2Id);

    let rootFor: WhatINeedGame["rootFor"];
    if (t1.impact > 0 && t2.impact > 0) {
      rootFor = "both";
    } else if (t1.impact > 0) {
      rootFor = "team1";
    } else if (t2.impact > 0) {
      rootFor = "team2";
    } else {
      rootFor = "none";
    }

    const buildTeamInfo = (
      teamId: string,
      score: number | null,
    ): WhatINeedTeamInfo | null => {
      const info = teamMap.get(teamId);
      if (!info) return null;
      return {
        teamId,
        name: info.name,
        shortName: info.shortName,
        abbreviation: info.abbreviation,
        logoUrl: info.logoUrl,
        darkLogoUrl: info.darkLogoUrl,
        seed: info.seed,
        score,
      };
    };

    // Skip games where the user has no stake
    if (rootFor === "none") continue;

    resultGames.push({
      gameId: game.id,
      round: game.round,
      status: game.status as WhatINeedGame["status"],
      statusDetail: game.statusDetail ?? null,
      startTime: game.startTime
        ? typeof game.startTime === "string"
          ? game.startTime
          : game.startTime.toISOString()
        : null,
      team1: buildTeamInfo(game.team1Id, game.team1Score),
      team2: buildTeamInfo(game.team2Id, game.team2Score),
      team1Impact: t1.impact,
      team2Impact: t2.impact,
      team1FurthestRound: t1.furthestRound,
      team2FurthestRound: t2.furthestRound,
      team1Eliminated: eliminatedTeams.has(game.team1Id),
      team2Eliminated: eliminatedTeams.has(game.team2Id),
      rootFor,
      totalImpact: Math.max(t1.impact, t2.impact),
    });
  }

  // Group by round in ROUND_ORDER, sort within by totalImpact desc
  const groupMap = new Map<string, WhatINeedGame[]>();
  for (const g of resultGames) {
    const list = groupMap.get(g.round) ?? [];
    list.push(g);
    groupMap.set(g.round, list);
  }

  const groups: WhatINeedRoundGroup[] = [];
  for (const round of ROUND_ORDER) {
    const roundGames = groupMap.get(round);
    if (!roundGames || roundGames.length === 0) continue;
    roundGames.sort((a, b) => b.totalImpact - a.totalImpact);
    groups.push({
      round,
      roundLabel: ROUND_LABELS[round] ?? round,
      games: roundGames,
    });
  }

  return groups;
}
