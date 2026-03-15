import type {
  BracketGame,
  BracketTeam,
  BracketPick,
  TeamStats,
} from "@/components/bracket/types";
import { ROUND_ORDER } from "@/components/bracket/types";

export type AutoFillStrategy =
  | "chalk"
  | "weighted_random"
  | "random"
  | "stats_custom";

export type ChaosLevel = "low" | "medium" | "high";

export interface StatWeights {
  ppg: number;
  oppPpg: number;
  fgPct: number;
  threePtPct: number;
  ftPct: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
}

export interface StatsAutoFillConfig {
  weights: StatWeights;
  chaosLevel: ChaosLevel;
}

export const STAT_CATEGORIES: {
  key: keyof StatWeights;
  label: string;
  inverted: boolean;
  group: string;
}[] = [
  { key: "ppg", label: "PPG", inverted: false, group: "Scoring" },
  { key: "oppPpg", label: "Opp PPG", inverted: true, group: "Scoring" },
  { key: "fgPct", label: "FG%", inverted: false, group: "Shooting" },
  { key: "threePtPct", label: "3PT%", inverted: false, group: "Shooting" },
  { key: "ftPct", label: "FT%", inverted: false, group: "Shooting" },
  {
    key: "reboundsPerGame",
    label: "RPG",
    inverted: false,
    group: "Hustle",
  },
  {
    key: "assistsPerGame",
    label: "APG",
    inverted: false,
    group: "Hustle",
  },
  {
    key: "stealsPerGame",
    label: "SPG",
    inverted: false,
    group: "Defense",
  },
  {
    key: "blocksPerGame",
    label: "BPG",
    inverted: false,
    group: "Defense",
  },
  {
    key: "turnoversPerGame",
    label: "TOPG",
    inverted: true,
    group: "Defense",
  },
];

export type PresetName =
  | "offense_heavy"
  | "defense_heavy"
  | "balanced"
  | "rebounding_hustle";

export const PRESETS: Record<
  PresetName,
  { label: string; weights: StatWeights }
> = {
  offense_heavy: {
    label: "Offense-Heavy",
    weights: {
      ppg: 9,
      oppPpg: 2,
      fgPct: 8,
      threePtPct: 7,
      ftPct: 6,
      reboundsPerGame: 2,
      assistsPerGame: 4,
      stealsPerGame: 1,
      blocksPerGame: 1,
      turnoversPerGame: 3,
    },
  },
  defense_heavy: {
    label: "Defense-Heavy",
    weights: {
      ppg: 2,
      oppPpg: 9,
      fgPct: 2,
      threePtPct: 1,
      ftPct: 1,
      reboundsPerGame: 4,
      assistsPerGame: 1,
      stealsPerGame: 8,
      blocksPerGame: 7,
      turnoversPerGame: 8,
    },
  },
  balanced: {
    label: "Balanced",
    weights: {
      ppg: 5,
      oppPpg: 5,
      fgPct: 5,
      threePtPct: 5,
      ftPct: 5,
      reboundsPerGame: 5,
      assistsPerGame: 5,
      stealsPerGame: 5,
      blocksPerGame: 5,
      turnoversPerGame: 5,
    },
  },
  rebounding_hustle: {
    label: "Rebounding & Hustle",
    weights: {
      ppg: 3,
      oppPpg: 3,
      fgPct: 2,
      threePtPct: 2,
      ftPct: 2,
      reboundsPerGame: 9,
      assistsPerGame: 4,
      stealsPerGame: 8,
      blocksPerGame: 7,
      turnoversPerGame: 5,
    },
  },
};

const CHAOS_UPSET_PROBABILITY: Record<ChaosLevel, number> = {
  low: 0.05,
  medium: 0.2,
  high: 0.4,
};

interface AutoFillResult {
  picks: BracketPick[];
  tiebreakerScore: number;
}

/**
 * Generates bracket picks for all unpicked games using the given strategy.
 * Processes games in round order so that source game picks are resolved before
 * downstream games.
 */
export function autoFillBracket(
  games: BracketGame[],
  teams: BracketTeam[],
  existingPicks: BracketPick[],
  strategy: AutoFillStrategy,
  statsConfig?: StatsAutoFillConfig,
): AutoFillResult {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const pickMap = new Map(
    existingPicks.map((p) => [p.tournamentGameId, p.pickedTeamId]),
  );

  // Sort games by round order
  const roundIndex = new Map<string, number>(ROUND_ORDER.map((r, i) => [r, i]));
  const sortedGames = [...games].sort(
    (a, b) => (roundIndex.get(a.round) ?? 0) - (roundIndex.get(b.round) ?? 0),
  );

  const newPicks: BracketPick[] = [];

  for (const game of sortedGames) {
    // Skip if already picked
    if (pickMap.has(game.id)) continue;

    // For games already started/finished, record the actual winner so
    // downstream games can resolve their teams, but don't generate a pick
    if (game.status === "in_progress" || game.status === "final") {
      if (game.winnerTeamId) {
        pickMap.set(game.id, game.winnerTeamId);
      }
      continue;
    }

    // Resolve teams for this game
    const team1 = resolveTeam(game, "team1", pickMap, games, teamMap);
    const team2 = resolveTeam(game, "team2", pickMap, games, teamMap);

    // Both teams must be available to make a pick
    if (!team1 || !team2) continue;

    const winner =
      strategy === "stats_custom" && statsConfig
        ? pickWinnerByStats(team1, team2, statsConfig)
        : pickWinner(team1, team2, strategy);
    pickMap.set(game.id, winner.id);
    newPicks.push({ tournamentGameId: game.id, pickedTeamId: winner.id });
  }

  // Generate a random tiebreaker in a realistic championship total range (100-180)
  const tiebreakerScore = Math.floor(Math.random() * 81) + 100;

  return { picks: newPicks, tiebreakerScore };
}

function resolveTeam(
  game: BracketGame,
  slot: "team1" | "team2",
  pickMap: Map<string, string>,
  games: BracketGame[],
  teamMap: Map<string, BracketTeam>,
): BracketTeam | null {
  const sourceGameId =
    slot === "team1" ? game.sourceGame1Id : game.sourceGame2Id;
  const directTeamId = slot === "team1" ? game.team1Id : game.team2Id;

  if (sourceGameId) {
    const pickedId = pickMap.get(sourceGameId);
    return pickedId ? (teamMap.get(pickedId) ?? null) : null;
  }

  if (directTeamId) {
    return teamMap.get(directTeamId) ?? null;
  }

  return null;
}

function pickWinner(
  team1: BracketTeam,
  team2: BracketTeam,
  strategy: AutoFillStrategy,
): BracketTeam {
  if (strategy === "chalk") {
    // Lower seed number = higher seed = favored
    // If equal seeds, pick team1 (arbitrary)
    return team1.seed <= team2.seed ? team1 : team2;
  }

  if (strategy === "random") {
    return Math.random() < 0.5 ? team1 : team2;
  }

  // Weighted random: P(team1 wins) = team2.seed / (team1.seed + team2.seed)
  const team1Weight = team2.seed;
  const team2Weight = team1.seed;
  const totalWeight = team1Weight + team2Weight;
  const roll = Math.random() * totalWeight;

  return roll < team1Weight ? team1 : team2;
}

/**
 * Computes a composite score for a team based on weighted stat categories.
 * For inverted stats (Opp PPG, TOPG), lower raw values produce higher scores.
 * Missing stats for a category are skipped (weight excluded from total).
 */
function computeTeamScore(
  stats: TeamStats | undefined,
  weights: StatWeights,
): number | null {
  if (!stats) return null;

  let totalScore = 0;
  let totalWeight = 0;

  for (const cat of STAT_CATEGORIES) {
    const weight = weights[cat.key];
    if (weight === 0) continue;

    const value = stats[cat.key];
    if (value == null) continue;

    // Normalize: for inverted stats, negate so that lower raw = higher score
    const normalized = cat.inverted ? -value : value;
    totalScore += normalized * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return totalScore / totalWeight;
}

/**
 * Picks a winner based on stats-weighted composite scores with chaos factor.
 * Falls back to seed-based logic when stats are unavailable.
 */
function pickWinnerByStats(
  team1: BracketTeam,
  team2: BracketTeam,
  config: StatsAutoFillConfig,
): BracketTeam {
  const score1 = computeTeamScore(team1.stats, config.weights);
  const score2 = computeTeamScore(team2.stats, config.weights);

  // Fall back to seed-based if no stats for either team
  if (score1 === null && score2 === null) {
    return team1.seed <= team2.seed ? team1 : team2;
  }

  // Determine stats-favored team (coin flip on ties)
  const statsFavored =
    score1 !== null && score2 !== null
      ? score1 > score2
        ? team1
        : score2 > score1
          ? team2
          : Math.random() < 0.5
            ? team1
            : team2
      : // If only one team has stats, favor that team
        score1 !== null
        ? team1
        : team2;

  const statsUnderdog = statsFavored === team1 ? team2 : team1;

  // Apply chaos: chance the underdog wins anyway
  const upsetChance = CHAOS_UPSET_PROBABILITY[config.chaosLevel];
  if (Math.random() < upsetChance) {
    return statsUnderdog;
  }

  return statsFavored;
}
