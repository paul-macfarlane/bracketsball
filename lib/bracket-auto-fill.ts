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

export type ChaosLevel = "none" | "low" | "medium" | "high";

export interface StatWeights {
  winPct: number;
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
  bpiOffense: number;
  bpiDefense: number;
  strengthOfSchedule: number;
  strengthOfRecord: number;
}

export interface StatsAutoFillConfig {
  weights: StatWeights;
  chaosLevel: ChaosLevel;
}

export const STAT_CATEGORIES: {
  key: keyof StatWeights;
  label: string;
  fullLabel: string;
  inverted: boolean;
  group: string;
}[] = [
  {
    key: "winPct",
    label: "Win %",
    fullLabel: "Win Percentage",
    inverted: false,
    group: "Overall",
  },
  {
    key: "ppg",
    label: "PPG",
    fullLabel: "Points Per Game",
    inverted: false,
    group: "Offense",
  },
  {
    key: "oppPpg",
    label: "Opp PPG",
    fullLabel: "Opponent Points Per Game",
    inverted: true,

    group: "Offense",
  },
  {
    key: "assistsPerGame",
    label: "APG",
    fullLabel: "Assists Per Game",
    inverted: false,
    group: "Offense",
  },
  {
    key: "fgPct",
    label: "FG%",
    fullLabel: "Field Goal Percentage",
    inverted: false,
    group: "Shooting",
  },
  {
    key: "threePtPct",
    label: "3PT%",
    fullLabel: "3-Point Percentage",
    inverted: false,
    group: "Shooting",
  },
  {
    key: "ftPct",
    label: "FT%",
    fullLabel: "Free Throw Percentage",
    inverted: false,
    group: "Shooting",
  },
  {
    key: "reboundsPerGame",
    label: "RPG",
    fullLabel: "Rebounds Per Game",
    inverted: false,
    group: "Hustle",
  },
  {
    key: "stealsPerGame",
    label: "SPG",
    fullLabel: "Steals Per Game",
    inverted: false,
    group: "Defense",
  },
  {
    key: "blocksPerGame",
    label: "BPG",
    fullLabel: "Blocks Per Game",
    inverted: false,
    group: "Defense",
  },
  {
    key: "turnoversPerGame",
    label: "TOPG",
    fullLabel: "Turnovers Per Game",
    inverted: true,

    group: "Defense",
  },
  {
    key: "bpiOffense",
    label: "BPI Offense",
    fullLabel: "BPI Offense",
    inverted: false,
    group: "BPI",
  },
  {
    key: "bpiDefense",
    label: "BPI Defense",
    fullLabel: "BPI Defense",
    inverted: false,

    group: "BPI",
  },
  {
    key: "strengthOfSchedule",
    label: "SOS",
    fullLabel: "Strength of Schedule",
    inverted: true,

    group: "Strength",
  },
  {
    key: "strengthOfRecord",
    label: "SOR",
    fullLabel: "Strength of Record",
    inverted: true,

    group: "Strength",
  },
];

export type PresetName =
  | "offense_heavy"
  | "defense_heavy"
  | "balanced"
  | "rebounding_hustle"
  | "bpi_focused"
  | "strength_focused"
  | "analytics_combined";

export const PRESETS: Record<
  PresetName,
  { label: string; weights: StatWeights }
> = {
  offense_heavy: {
    label: "Offense-Heavy",
    weights: {
      winPct: 3,
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
      bpiOffense: 8,
      bpiDefense: 2,
      strengthOfSchedule: 2,
      strengthOfRecord: 2,
    },
  },
  defense_heavy: {
    label: "Defense-Heavy",
    weights: {
      winPct: 3,
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
      bpiOffense: 2,
      bpiDefense: 8,
      strengthOfSchedule: 3,
      strengthOfRecord: 3,
    },
  },
  balanced: {
    label: "Balanced",
    weights: {
      winPct: 5,
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
      bpiOffense: 5,
      bpiDefense: 5,
      strengthOfSchedule: 5,
      strengthOfRecord: 5,
    },
  },
  rebounding_hustle: {
    label: "Rebounding & Hustle",
    weights: {
      winPct: 3,
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
      bpiOffense: 3,
      bpiDefense: 3,
      strengthOfSchedule: 3,
      strengthOfRecord: 3,
    },
  },
  bpi_focused: {
    label: "BPI-Focused",
    weights: {
      winPct: 3,
      ppg: 2,
      oppPpg: 2,
      fgPct: 1,
      threePtPct: 1,
      ftPct: 1,
      reboundsPerGame: 1,
      assistsPerGame: 1,
      stealsPerGame: 1,
      blocksPerGame: 1,
      turnoversPerGame: 2,
      bpiOffense: 9,
      bpiDefense: 9,
      strengthOfSchedule: 3,
      strengthOfRecord: 3,
    },
  },
  strength_focused: {
    label: "Strength of Schedule & Record",
    weights: {
      winPct: 4,
      ppg: 1,
      oppPpg: 1,
      fgPct: 1,
      threePtPct: 1,
      ftPct: 1,
      reboundsPerGame: 1,
      assistsPerGame: 1,
      stealsPerGame: 1,
      blocksPerGame: 1,
      turnoversPerGame: 1,
      bpiOffense: 2,
      bpiDefense: 2,
      strengthOfSchedule: 9,
      strengthOfRecord: 9,
    },
  },
  analytics_combined: {
    label: "Analytics (BPI + SOS/SOR)",
    weights: {
      winPct: 4,
      ppg: 1,
      oppPpg: 1,
      fgPct: 1,
      threePtPct: 1,
      ftPct: 1,
      reboundsPerGame: 1,
      assistsPerGame: 1,
      stealsPerGame: 1,
      blocksPerGame: 1,
      turnoversPerGame: 1,
      bpiOffense: 8,
      bpiDefense: 8,
      strengthOfSchedule: 8,
      strengthOfRecord: 8,
    },
  },
};

const CHAOS_UPSET_PROBABILITY: Record<ChaosLevel, number> = {
  none: 0,
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

  // Pre-compute global stat ranges across all teams so that per-matchup
  // normalization preserves actual magnitude differences between teams.
  const globalStatRanges =
    strategy === "stats_custom" && statsConfig
      ? computeGlobalStatRanges(teams)
      : new Map();

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

    // If only one team is available (e.g. other slot is TBD from an
    // in-progress First Four game), auto-pick the known team.
    if (!team1 && !team2) continue;

    const winner =
      team1 && team2
        ? strategy === "stats_custom" && statsConfig
          ? pickWinnerByStats(team1, team2, statsConfig, globalStatRanges)
          : pickWinner(team1, team2, strategy)
        : (team1 ?? team2)!;
    pickMap.set(game.id, winner.id);
    newPicks.push({ tournamentGameId: game.id, pickedTeamId: winner.id });
  }

  // Generate tiebreaker: use championship finalists' PPG if available, else random
  const tiebreakerScore = generateTiebreaker(sortedGames, pickMap, teamMap);

  return { picks: newPicks, tiebreakerScore };
}

/**
 * Generates a tiebreaker score. For stats-aware strategies, sums the PPG of
 * the two championship finalists. Falls back to a random value in a realistic range.
 */
function generateTiebreaker(
  sortedGames: BracketGame[],
  pickMap: Map<string, string>,
  teamMap: Map<string, BracketTeam>,
): number {
  const champGame = sortedGames.find((g) => g.round === "championship");
  if (champGame) {
    const team1 = resolveTeam(
      champGame,
      "team1",
      pickMap,
      sortedGames,
      teamMap,
    );
    const team2 = resolveTeam(
      champGame,
      "team2",
      pickMap,
      sortedGames,
      teamMap,
    );
    const ppg1 = team1?.stats?.ppg;
    const ppg2 = team2?.stats?.ppg;
    if (ppg1 != null && ppg2 != null) {
      return Math.round(ppg1 + ppg2);
    }
  }
  // Random fallback in a realistic championship total range (100-180)
  return Math.floor(Math.random() * 81) + 100;
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
    // If equal seeds, coin flip
    if (team1.seed === team2.seed) return Math.random() < 0.5 ? team1 : team2;
    return team1.seed < team2.seed ? team1 : team2;
  }

  if (strategy === "random") {
    return Math.random() < 0.5 ? team1 : team2;
  }

  // Weighted random using historical NCAA upset rates by seed differential.
  // Higher seed's win probability is looked up from historical data.
  const higherSeed = team1.seed <= team2.seed ? team1 : team2;
  const lowerSeed = higherSeed === team1 ? team2 : team1;
  const prob = historicalHigherSeedWinRate(higherSeed.seed, lowerSeed.seed);
  return Math.random() < prob ? higherSeed : lowerSeed;
}

/**
 * Returns approximate win probability for the higher-seeded team based on
 * historical NCAA tournament matchup data. Falls back to a seed-ratio
 * formula for matchups not in the lookup table.
 */
function historicalHigherSeedWinRate(
  higherSeed: number,
  lowerSeed: number,
): number {
  // Historical win rates for the higher seed in common first-round matchups
  // Source: aggregated NCAA tournament data 1985-2024
  const HISTORICAL_RATES: Record<string, number> = {
    "1v16": 0.99,
    "2v15": 0.94,
    "3v14": 0.85,
    "4v13": 0.79,
    "5v12": 0.65,
    "6v11": 0.63,
    "7v10": 0.61,
    "8v9": 0.51,
  };
  const key = `${higherSeed}v${lowerSeed}`;
  if (key in HISTORICAL_RATES) {
    return HISTORICAL_RATES[key];
  }
  // Fallback for later-round cross-seed matchups: seed-ratio formula
  return lowerSeed / (higherSeed + lowerSeed);
}

/**
 * Derives the win percentage from a team's win/loss record.
 * Returns null if the data is unavailable or the team has played no games.
 */
function deriveWinPct(stats: TeamStats | undefined): number | null {
  if (!stats || stats.overallWins == null || stats.overallLosses == null)
    return null;
  const total = stats.overallWins + stats.overallLosses;
  if (total === 0) return null;
  return stats.overallWins / total;
}

/**
 * Gets the stat value for a category, handling the derived winPct stat
 * that isn't a direct field on TeamStats.
 */
function getStatValue(
  stats: TeamStats | undefined,
  key: keyof StatWeights,
): number | null {
  if (key === "winPct") return deriveWinPct(stats);
  return stats?.[key] ?? null;
}

/**
 * Computes stat ranges (min/max) across ALL tournament teams for min-max
 * normalization. Using global ranges (instead of per-matchup ranges) preserves
 * the actual magnitude of differences between teams. Without this, a 0.1 PPG
 * difference would look identical to a 20 PPG difference in the composite
 * score, and the chaos closeness metric would be unreliable.
 */
function computeGlobalStatRanges(
  teams: BracketTeam[],
): Map<keyof StatWeights, { min: number; max: number }> {
  const ranges = new Map<keyof StatWeights, { min: number; max: number }>();
  for (const cat of STAT_CATEGORIES) {
    const values: number[] = [];
    for (const team of teams) {
      const v = getStatValue(team.stats, cat.key);
      if (v != null) values.push(v);
    }
    if (values.length > 0) {
      ranges.set(cat.key, {
        min: Math.min(...values),
        max: Math.max(...values),
      });
    }
  }
  return ranges;
}

/**
 * Computes a composite score for a team based on weighted stat categories.
 * Stats are min-max normalized to 0-1 using the provided ranges so that all
 * categories contribute proportionally to their weights regardless of scale.
 * For inverted stats (Opp PPG, TOPG), the normalization is flipped so that
 * lower raw values produce higher normalized scores.
 */
function computeTeamScore(
  stats: TeamStats | undefined,
  weights: StatWeights,
  statRanges: Map<keyof StatWeights, { min: number; max: number }>,
): number | null {
  if (!stats) return null;

  let totalScore = 0;
  let totalWeight = 0;

  for (const cat of STAT_CATEGORIES) {
    const weight = weights[cat.key];
    if (weight === 0) continue;

    const value = getStatValue(stats, cat.key);
    if (value == null) continue;

    const range = statRanges.get(cat.key);
    if (!range) continue;

    let normalized: number;
    if (range.max === range.min) {
      // Both teams have the same value — no differentiation
      normalized = 0.5;
    } else {
      // Normalize to 0-1; for inverted stats, flip so lower raw = higher score
      normalized = cat.inverted
        ? (range.max - value) / (range.max - range.min)
        : (value - range.min) / (range.max - range.min);
    }

    totalScore += normalized * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return null;
  return totalScore / totalWeight;
}

/**
 * Picks a winner based on stats-weighted composite scores with chaos factor.
 * Falls back to seed-based logic when stats are unavailable.
 *
 * Chaos is score-aware: the upset probability scales with how close the matchup
 * is. A near-tie gets close to the full chaos probability, while a dominant
 * favorite gets a much smaller upset chance. At chaos "none", the favored team
 * always wins.
 */
function pickWinnerByStats(
  team1: BracketTeam,
  team2: BracketTeam,
  config: StatsAutoFillConfig,
  globalStatRanges: Map<keyof StatWeights, { min: number; max: number }>,
): BracketTeam {
  const score1 = computeTeamScore(
    team1.stats,
    config.weights,
    globalStatRanges,
  );
  const score2 = computeTeamScore(
    team2.stats,
    config.weights,
    globalStatRanges,
  );

  // Fall back to seed-based if no stats for either team
  if (score1 === null && score2 === null) {
    if (team1.seed === team2.seed) return Math.random() < 0.5 ? team1 : team2;
    return team1.seed < team2.seed ? team1 : team2;
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

  // Apply score-aware chaos: scale upset probability by closeness of matchup.
  // closeness is 0 when scores are maximally different (0 vs 1 on normalized
  // scale) and 1 when scores are identical. This means tight matchups get the
  // full configured upset chance, while blowouts get very little.
  const baseChaos = CHAOS_UPSET_PROBABILITY[config.chaosLevel];
  if (baseChaos > 0 && score1 !== null && score2 !== null) {
    const scoreDiff = Math.abs(score1 - score2);
    // Max possible diff on normalized 0-1 scores is 1.0
    const closeness = 1 - scoreDiff;
    const upsetChance = baseChaos * closeness;
    if (Math.random() < upsetChance) {
      return statsUnderdog;
    }
  }

  return statsFavored;
}
