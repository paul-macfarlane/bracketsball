import type {
  BracketGame,
  BracketTeam,
  BracketPick,
} from "@/components/bracket/types";
import { ROUND_ORDER } from "@/components/bracket/types";

export type AutoFillStrategy = "chalk" | "weighted_random" | "random";

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

    // Resolve teams for this game
    const team1 = resolveTeam(game, "team1", pickMap, games, teamMap);
    const team2 = resolveTeam(game, "team2", pickMap, games, teamMap);

    // Both teams must be available to make a pick
    if (!team1 || !team2) continue;

    const winner = pickWinner(team1, team2, strategy);
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
