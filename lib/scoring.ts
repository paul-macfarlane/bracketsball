export const DEFAULT_SCORING = {
  firstFour: 0,
  round64: 1,
  round32: 2,
  sweet16: 4,
  elite8: 8,
  finalFour: 16,
  championship: 32,
} as const;

export interface PoolScoring {
  scoringFirstFour: number;
  scoringRound64: number;
  scoringRound32: number;
  scoringSweet16: number;
  scoringElite8: number;
  scoringFinalFour: number;
  scoringChampionship: number;
}

const ROUND_TO_SCORING_KEY: Record<string, keyof PoolScoring> = {
  first_four: "scoringFirstFour",
  round_of_64: "scoringRound64",
  round_of_32: "scoringRound32",
  sweet_16: "scoringSweet16",
  elite_8: "scoringElite8",
  final_four: "scoringFinalFour",
  championship: "scoringChampionship",
};

export function getPointsForRound(
  round: string,
  poolScoring: PoolScoring,
): number {
  const key = ROUND_TO_SCORING_KEY[round];
  return key ? poolScoring[key] : 0;
}

interface GameForScoring {
  id: string;
  round: string;
  winnerTeamId: string | null;
  status: string;
  team1Id: string | null;
  team2Id: string | null;
}

interface PickForScoring {
  tournamentGameId: string;
  pickedTeamId: string;
}

export function calculateBracketScores(
  games: GameForScoring[],
  picks: PickForScoring[],
  poolScoring: PoolScoring,
): { totalPoints: number; potentialPoints: number } {
  const picksByGame = new Map(picks.map((p) => [p.tournamentGameId, p]));

  // Build set of eliminated teams (lost in a completed game)
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

  let totalPoints = 0;
  let potentialPoints = 0;

  for (const game of games) {
    const pick = picksByGame.get(game.id);
    if (!pick) continue;

    const roundPoints = getPointsForRound(game.round, poolScoring);

    if (game.status === "final" && game.winnerTeamId) {
      if (pick.pickedTeamId === game.winnerTeamId) {
        totalPoints += roundPoints;
        potentialPoints += roundPoints;
      }
      // Incorrect pick: 0 points, 0 potential
    } else {
      // Game not yet decided — add to potential if team is still alive
      if (!eliminatedTeams.has(pick.pickedTeamId)) {
        potentialPoints += roundPoints;
      }
    }
  }

  return { totalPoints, potentialPoints };
}

export interface StandingsEntry {
  name: string;
  totalPoints: number;
  potentialPoints: number;
  tiebreakerDiff: number | null;
}

export function sortAndRankStandings<T extends StandingsEntry>(
  entries: T[],
): (T & { rank: number })[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.potentialPoints !== a.potentialPoints)
      return b.potentialPoints - a.potentialPoints;
    if (a.tiebreakerDiff !== null && b.tiebreakerDiff !== null) {
      if (a.tiebreakerDiff !== b.tiebreakerDiff)
        return a.tiebreakerDiff - b.tiebreakerDiff;
    }
    return a.name.localeCompare(b.name);
  });

  const ranked: (T & { rank: number })[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    let rank = i + 1;
    if (i > 0) {
      const prev = sorted[i - 1];
      if (
        entry.totalPoints === prev.totalPoints &&
        entry.potentialPoints === prev.potentialPoints &&
        entry.tiebreakerDiff === prev.tiebreakerDiff
      ) {
        rank = ranked[i - 1].rank;
      }
    }
    ranked.push({ ...entry, rank });
  }

  return ranked;
}
