/**
 * Fetches team stats and records from ESPN's team API.
 * Uses /teams/{espnId} for records and conference info,
 * and /teams/{espnId}/statistics for detailed stats.
 */

const ESPN_TEAMS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams";

const ESPN_RANKINGS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TeamStats {
  espnId: string;
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
}

// ESPN team API response types (subset we care about)
interface ESPNTeamResponse {
  team?: {
    id: string;
    record?: {
      items?: ESPNRecordItem[];
    };
    groups?: {
      id: string;
      parent?: { id: string };
      isConference?: boolean;
    };
    standingSummary?: string;
  };
}

interface ESPNRecordItem {
  description?: string;
  type?: string;
  summary?: string;
  stats?: { name: string; value: number }[];
}

interface ESPNStatsResponse {
  results?: {
    stats?: {
      categories?: ESPNStatCategory[];
    };
  };
  // The actual structure is at the top level
  stats?: {
    categories?: ESPNStatCategory[];
  };
}

interface ESPNStatCategory {
  name: string;
  stats?: ESPNStat[];
}

interface ESPNStat {
  name: string;
  displayName?: string;
  abbreviation?: string;
  value: number;
}

interface ESPNRankingsResponse {
  rankings?: {
    type?: string;
    name?: string;
    ranks?: {
      current: number;
      team: { id: string };
    }[];
  }[];
}

function findStatValue(
  categories: ESPNStatCategory[],
  categoryName: string,
  statName: string,
): number | null {
  const category = categories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
  );
  if (!category?.stats) return null;
  const stat = category.stats.find(
    (s) => s.name.toLowerCase() === statName.toLowerCase(),
  );
  return stat?.value ?? null;
}

function findRecordStats(
  items: ESPNRecordItem[] | undefined,
  type: string,
): { wins: number | null; losses: number | null } {
  if (!items) return { wins: null, losses: null };
  const item = items.find(
    (i) =>
      i.type === type ||
      i.description?.toLowerCase().includes(type.toLowerCase()),
  );
  if (!item?.stats) {
    // Try parsing from summary like "23-8"
    if (item?.summary) {
      const parts = item.summary.split("-").map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { wins: parts[0], losses: parts[1] };
      }
    }
    return { wins: null, losses: null };
  }
  const wins =
    item.stats.find((s) => s.name === "wins")?.value ??
    item.stats.find((s) => s.name === "leagueWins")?.value ??
    null;
  const losses =
    item.stats.find((s) => s.name === "losses")?.value ??
    item.stats.find((s) => s.name === "leagueLosses")?.value ??
    null;
  return { wins, losses };
}

async function fetchTeamInfo(espnId: string): Promise<{
  overallWins: number | null;
  overallLosses: number | null;
  conferenceWins: number | null;
  conferenceLosses: number | null;
  conferenceName: string | null;
  oppPpg: number | null;
}> {
  const url = `${ESPN_TEAMS_URL}/${espnId}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Bracketsball/1.0" },
  });

  if (!response.ok) {
    console.warn(
      `[espn-stats] Failed to fetch team ${espnId}: ${response.status}`,
    );
    return {
      overallWins: null,
      overallLosses: null,
      conferenceWins: null,
      conferenceLosses: null,
      conferenceName: null,
      oppPpg: null,
    };
  }

  const data: ESPNTeamResponse = await response.json();
  const team = data.team;
  if (!team) {
    return {
      overallWins: null,
      overallLosses: null,
      conferenceWins: null,
      conferenceLosses: null,
      conferenceName: null,
      oppPpg: null,
    };
  }

  const recordItems = team.record?.items;
  const overall = findRecordStats(recordItems, "total");
  const conference = findRecordStats(recordItems, "vsconf");

  // Get oppPpg from overall record stats
  let oppPpg: number | null = null;
  const overallItem = recordItems?.find(
    (i) => i.type === "total" || i.description?.toLowerCase() === "overall",
  );
  if (overallItem?.stats) {
    oppPpg =
      overallItem.stats.find((s) => s.name === "avgPointsAgainst")?.value ??
      null;
  }

  // Conference name from standingSummary (e.g., "6th in Big Ten")
  let conferenceName: string | null = null;
  if (team.standingSummary) {
    const match = team.standingSummary.match(/(?:in|of)\s+(.+)$/i);
    if (match) {
      conferenceName = match[1].trim();
    }
  }

  return {
    overallWins: overall.wins,
    overallLosses: overall.losses,
    conferenceWins: conference.wins,
    conferenceLosses: conference.losses,
    conferenceName,
    oppPpg,
  };
}

async function fetchTeamStatistics(espnId: string): Promise<{
  ppg: number | null;
  fgPct: number | null;
  threePtPct: number | null;
  ftPct: number | null;
  reboundsPerGame: number | null;
  assistsPerGame: number | null;
  stealsPerGame: number | null;
  blocksPerGame: number | null;
  turnoversPerGame: number | null;
}> {
  const url = `${ESPN_TEAMS_URL}/${espnId}/statistics`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Bracketsball/1.0" },
  });

  if (!response.ok) {
    console.warn(
      `[espn-stats] Failed to fetch stats for ${espnId}: ${response.status}`,
    );
    return {
      ppg: null,
      fgPct: null,
      threePtPct: null,
      ftPct: null,
      reboundsPerGame: null,
      assistsPerGame: null,
      stealsPerGame: null,
      blocksPerGame: null,
      turnoversPerGame: null,
    };
  }

  const data: ESPNStatsResponse = await response.json();
  const categories = data.stats?.categories ?? data.results?.stats?.categories;
  if (!categories) {
    return {
      ppg: null,
      fgPct: null,
      threePtPct: null,
      ftPct: null,
      reboundsPerGame: null,
      assistsPerGame: null,
      stealsPerGame: null,
      blocksPerGame: null,
      turnoversPerGame: null,
    };
  }

  return {
    ppg: findStatValue(categories, "offensive", "avgPoints"),
    fgPct: findStatValue(categories, "offensive", "fieldGoalPct"),
    threePtPct: findStatValue(
      categories,
      "offensive",
      "threePointFieldGoalPct",
    ),
    ftPct: findStatValue(categories, "offensive", "freeThrowPct"),
    reboundsPerGame: findStatValue(categories, "general", "avgRebounds"),
    assistsPerGame: findStatValue(categories, "offensive", "avgAssists"),
    stealsPerGame: findStatValue(categories, "defensive", "avgSteals"),
    blocksPerGame: findStatValue(categories, "defensive", "avgBlocks"),
    turnoversPerGame: findStatValue(categories, "offensive", "avgTurnovers"),
  };
}

async function fetchAPRankings(): Promise<Map<string, number>> {
  const rankings = new Map<string, number>();
  try {
    const response = await fetch(ESPN_RANKINGS_URL, {
      headers: { "User-Agent": "Bracketsball/1.0" },
    });
    if (!response.ok) return rankings;

    const data: ESPNRankingsResponse = await response.json();
    const apPoll = data.rankings?.find((r) => r.type === "ap");
    if (apPoll?.ranks) {
      for (const rank of apPoll.ranks) {
        rankings.set(rank.team.id, rank.current);
      }
    }
  } catch (err) {
    console.warn("[espn-stats] Failed to fetch AP rankings:", err);
  }
  return rankings;
}

/**
 * Fetch stats for a single team from ESPN.
 */
export async function fetchTeamStats(
  espnId: string,
  apRankings?: Map<string, number>,
): Promise<TeamStats> {
  const [info, statistics] = await Promise.all([
    fetchTeamInfo(espnId),
    fetchTeamStatistics(espnId),
  ]);

  return {
    espnId,
    ...info,
    ...statistics,
    apRanking: apRankings?.get(espnId) ?? null,
  };
}

/**
 * Fetch stats for all teams in a list. Includes 300ms delay between
 * teams to be respectful to ESPN's API.
 */
export async function fetchAllTeamStats(
  espnIds: string[],
  onProgress?: (completed: number, total: number, teamName?: string) => void,
): Promise<TeamStats[]> {
  const apRankings = await fetchAPRankings();
  const results: TeamStats[] = [];

  for (let i = 0; i < espnIds.length; i++) {
    const stats = await fetchTeamStats(espnIds[i], apRankings);
    results.push(stats);
    onProgress?.(i + 1, espnIds.length);

    // Rate limit
    if (i < espnIds.length - 1) {
      await delay(300);
    }
  }

  return results;
}
