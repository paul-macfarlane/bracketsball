export type TournamentRound =
  | "first_four"
  | "round_of_64"
  | "round_of_32"
  | "sweet_16"
  | "elite_8"
  | "final_four"
  | "championship";

export type TournamentRegion = "south" | "east" | "west" | "midwest";

export type GameStatus = "scheduled" | "in_progress" | "final";

export interface SyncTeam {
  espnId: string;
  name: string;
  shortName: string;
  abbreviation: string;
  logoUrl: string | null;
  seed: number;
}

export interface SyncGame {
  espnEventId: string;
  round: TournamentRound;
  region: TournamentRegion | null;
  status: GameStatus;
  statusDetail: string | null;
  startTime: Date | null;
  venue: { name: string | null; city: string | null; state: string | null };
  team1: SyncTeam | null; // higher seed
  team2: SyncTeam | null; // lower seed
  team1Score: number | null;
  team2Score: number | null;
  winnerEspnTeamId: string | null;
}

export interface TournamentDataSource {
  fetchGamesByDate(date: string): Promise<SyncGame[]>;
  fetchGamesForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<SyncGame[]>;
}

export interface SyncResult {
  gamesUpdated: number;
  gamesSkipped: number;
  teamsUpserted: number;
  errors: string[];
}
