export interface BracketGame {
  id: string;
  round: string;
  region: string | null;
  gameNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  sourceGame1Id: string | null;
  sourceGame2Id: string | null;
  winnerTeamId: string | null;
  status: string;
}

export interface BracketTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  seed: number;
  region: string;
}

export interface BracketPick {
  tournamentGameId: string;
  pickedTeamId: string;
}

export const ROUND_ORDER = [
  "first_four",
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
] as const;

export const ROUND_LABELS: Record<string, string> = {
  first_four: "First Four",
  round_of_64: "Round of 64",
  round_of_32: "Round of 32",
  sweet_16: "Sweet 16",
  elite_8: "Elite 8",
  final_four: "Final Four",
  championship: "Championship",
};

export const REGION_LABELS: Record<string, string> = {
  south: "South",
  east: "East",
  west: "West",
  midwest: "Midwest",
};
