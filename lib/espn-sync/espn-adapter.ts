import type { ESPNScoreboardResponse, ESPNEvent } from "./espn-types";
import { parseHeadline } from "./parse-headline";
import type {
  SyncGame,
  SyncTeam,
  GameStatus,
  TournamentDataSource,
} from "./types";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapStatus(espnStatusName: string): GameStatus {
  switch (espnStatusName) {
    case "STATUS_FINAL":
      return "final";
    case "STATUS_IN_PROGRESS":
      return "in_progress";
    default:
      return "scheduled";
  }
}

function parseEvent(event: ESPNEvent): SyncGame | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  // Only tournament games (tournamentId 22 is March Madness)
  // ESPN returns this as a number, but handle string too for safety
  const tid = competition.tournamentId;
  if (tid !== undefined && String(tid) !== "22") {
    return null;
  }

  // Parse round/region from headline
  const headline = competition.notes?.find((n) => n.headline)?.headline ?? "";
  if (!headline) return null;

  const { round, region } = parseHeadline(headline);
  if (!round) {
    console.warn(
      `[espn-sync] Could not parse round from headline: "${headline}" (event ${event.id})`,
    );
    return null;
  }

  // Parse competitors
  const competitors = competition.competitors ?? [];
  if (competitors.length < 2) return null;

  // Sort by seed (higher seed = team1, lower seed = team2)
  const sorted = [...competitors].sort((a, b) => {
    const seedA = a.curatedRank?.current ?? 99;
    const seedB = b.curatedRank?.current ?? 99;
    return seedA - seedB;
  });

  function toSyncTeam(comp: (typeof competitors)[0]): SyncTeam | null {
    if (!comp.team) return null;
    const seed = comp.curatedRank?.current;
    if (!seed) return null;

    return {
      espnId: comp.team.id,
      name: comp.team.location ?? comp.team.displayName,
      shortName: comp.team.shortDisplayName,
      abbreviation: comp.team.abbreviation,
      logoUrl: `https://a.espncdn.com/i/teamlogos/ncaa/500/${comp.team.id}.png`,
      seed,
    };
  }

  const status = mapStatus(event.status?.type?.name ?? "");
  const team1 = toSyncTeam(sorted[0]);
  const team2 = toSyncTeam(sorted[1]);

  // Determine winner
  let winnerEspnTeamId: string | null = null;
  if (status === "final") {
    const winner = competitors.find((c) => c.winner);
    if (winner) {
      winnerEspnTeamId = winner.team.id;
    }
  }

  const team1Score =
    sorted[0].score != null ? parseInt(sorted[0].score, 10) : null;
  const team2Score =
    sorted[1].score != null ? parseInt(sorted[1].score, 10) : null;

  return {
    espnEventId: event.id,
    round,
    region,
    status,
    startTime: event.date ? new Date(event.date) : null,
    venue: {
      name: competition.venue?.fullName ?? null,
      city: competition.venue?.address?.city ?? null,
      state: competition.venue?.address?.state ?? null,
    },
    team1: team1,
    team2: team2,
    team1Score: isNaN(team1Score as number) ? null : team1Score,
    team2Score: isNaN(team2Score as number) ? null : team2Score,
    winnerEspnTeamId,
  };
}

export async function fetchESPNScoreboard(
  date: string,
): Promise<ESPNScoreboardResponse> {
  const dateFormatted = date.replace(/-/g, "");
  const url = `${ESPN_SCOREBOARD_URL}?groups=100&dates=${dateFormatted}&limit=200`;

  const response = await fetch(url, {
    headers: { "User-Agent": "Bracketsball/1.0" },
  });

  if (!response.ok) {
    throw new Error(
      `ESPN API error: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

export const espnAdapter: TournamentDataSource = {
  async fetchGamesByDate(date: string): Promise<SyncGame[]> {
    const data = await fetchESPNScoreboard(date);
    const events = data.events ?? [];

    const games: SyncGame[] = [];
    for (const event of events) {
      const game = parseEvent(event);
      if (game) {
        games.push(game);
      }
    }

    return games;
  },

  async fetchGamesForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<SyncGame[]> {
    const allGames: SyncGame[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const games = await espnAdapter.fetchGamesByDate(dateStr);
      allGames.push(...games);

      // 500ms delay to be respectful to ESPN's API
      if (current < end) {
        await delay(500);
      }

      current.setDate(current.getDate() + 1);
    }

    return allGames;
  },
};
