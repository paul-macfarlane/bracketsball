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
  statusDetail: string | null;
  team1Score: number | null;
  team2Score: number | null;
  startTime: Date | null;
  venueName: string | null;
  venueCity: string | null;
  venueState: string | null;
}

export interface TeamStats {
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
}

export interface BracketTeam {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  mascot: string | null;
  logoUrl: string | null;
  darkLogoUrl: string | null;
  seed: number;
  region: string;
  stats?: TeamStats;
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
