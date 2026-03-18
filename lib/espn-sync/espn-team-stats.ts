/**
 * Fetches team stats and records from ESPN's team API.
 * Uses /teams/{espnId} for records and conference info,
 * and /teams/{espnId}/statistics for detailed stats.
 */

const ESPN_TEAMS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams";

const ESPN_RANKINGS_URL =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings";

const ESPN_POWERINDEX_URL =
  "https://sports.core.api.espn.com/v2/sports/basketball/leagues/mens-college-basketball/seasons";

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
  bpi: number | null;
  bpiOffense: number | null;
  bpiDefense: number | null;
  bpiRank: number | null;
  bpiOffenseRank: number | null;
  bpiDefenseRank: number | null;
  strengthOfSchedule: number | null;
  strengthOfScheduleRank: number | null;
  strengthOfRecord: number | null;
  strengthOfRecordRank: number | null;
}

interface ESPNPowerIndexStat {
  name: string;
  value: number;
}

interface ESPNPowerIndexResponse {
  stats?: ESPNPowerIndexStat[];
  bpi?: number;
  bpioffense?: number;
  bpidefense?: number;
  bpirank?: number;
  bpioffenserank?: number;
  bpidefenserank?: number;
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
  // Team metadata (available when ?season= is used)
  team?: {
    recordSummary?: string; // e.g. "21-13"
    standingSummary?: string; // e.g. "6th in Big 12"
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

async function fetchTeamInfo(
  espnId: string,
  season?: number,
): Promise<{
  overallWins: number | null;
  overallLosses: number | null;
  conferenceWins: number | null;
  conferenceLosses: number | null;
  conferenceName: string | null;
  oppPpg: number | null;
}> {
  const url = season
    ? `${ESPN_TEAMS_URL}/${espnId}?season=${season}`
    : `${ESPN_TEAMS_URL}/${espnId}`;
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

interface TeamStatisticsResult {
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
  // Record info from statistics endpoint (season-aware, unlike team info endpoint)
  overallWins: number | null;
  overallLosses: number | null;
  conferenceName: string | null;
}

const EMPTY_STATISTICS: TeamStatisticsResult = {
  ppg: null,
  oppPpg: null,
  fgPct: null,
  threePtPct: null,
  ftPct: null,
  reboundsPerGame: null,
  assistsPerGame: null,
  stealsPerGame: null,
  blocksPerGame: null,
  turnoversPerGame: null,
  overallWins: null,
  overallLosses: null,
  conferenceName: null,
};

async function fetchTeamStatistics(
  espnId: string,
  season?: number,
): Promise<TeamStatisticsResult> {
  const url = season
    ? `${ESPN_TEAMS_URL}/${espnId}/statistics?season=${season}`
    : `${ESPN_TEAMS_URL}/${espnId}/statistics`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Bracketsball/1.0" },
  });

  if (!response.ok) {
    console.warn(
      `[espn-stats] Failed to fetch stats for ${espnId}: ${response.status}`,
    );
    return EMPTY_STATISTICS;
  }

  const data: ESPNStatsResponse = await response.json();
  const categories = data.stats?.categories ?? data.results?.stats?.categories;
  if (!categories) {
    return EMPTY_STATISTICS;
  }

  // Parse record from statistics endpoint team metadata (season-aware)
  let overallWins: number | null = null;
  let overallLosses: number | null = null;
  let conferenceName: string | null = null;

  if (data.team?.recordSummary) {
    const parts = data.team.recordSummary.split("-").map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      overallWins = parts[0];
      overallLosses = parts[1];
    }
  }
  if (data.team?.standingSummary) {
    const match = data.team.standingSummary.match(/(?:in|of)\s+(.+)$/i);
    if (match) {
      conferenceName = match[1].trim();
    }
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
    oppPpg: findStatValue(categories, "defensive", "avgPointsAgainst"),
    overallWins,
    overallLosses,
    conferenceName,
  };
}

async function fetchAPRankings(season?: number): Promise<Map<string, number>> {
  const rankings = new Map<string, number>();
  try {
    const url = season
      ? `${ESPN_RANKINGS_URL}?season=${season}`
      : ESPN_RANKINGS_URL;
    const response = await fetch(url, {
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

interface PowerIndexResult {
  bpi: number | null;
  bpiOffense: number | null;
  bpiDefense: number | null;
  bpiRank: number | null;
  bpiOffenseRank: number | null;
  bpiDefenseRank: number | null;
  strengthOfSchedule: number | null;
  strengthOfScheduleRank: number | null;
  strengthOfRecord: number | null;
  strengthOfRecordRank: number | null;
}

const EMPTY_POWER_INDEX: PowerIndexResult = {
  bpi: null,
  bpiOffense: null,
  bpiDefense: null,
  bpiRank: null,
  bpiOffenseRank: null,
  bpiDefenseRank: null,
  strengthOfSchedule: null,
  strengthOfScheduleRank: null,
  strengthOfRecord: null,
  strengthOfRecordRank: null,
};

function findPowerIndexStat(
  stats: ESPNPowerIndexStat[] | undefined,
  name: string,
): number | null {
  if (!stats) return null;
  const stat = stats.find((s) => s.name === name);
  return stat?.value ?? null;
}

async function fetchTeamPowerIndex(
  espnId: string,
  season?: number,
): Promise<PowerIndexResult> {
  const year = season ?? new Date().getFullYear();
  const url = `${ESPN_POWERINDEX_URL}/${year}/powerindex/${espnId}`;
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Bracketsball/1.0" },
    });
    if (!response.ok) {
      console.warn(
        `[espn-stats] Failed to fetch power index for ${espnId}: ${response.status}`,
      );
      return EMPTY_POWER_INDEX;
    }
    const data: ESPNPowerIndexResponse = await response.json();
    const stats = data.stats;
    return {
      bpi: data.bpi ?? findPowerIndexStat(stats, "bpi"),
      bpiOffense: data.bpioffense ?? findPowerIndexStat(stats, "bpioffense"),
      bpiDefense: data.bpidefense ?? findPowerIndexStat(stats, "bpidefense"),
      bpiRank: data.bpirank ?? findPowerIndexStat(stats, "bpirank"),
      bpiOffenseRank:
        data.bpioffenserank ?? findPowerIndexStat(stats, "bpioffenserank"),
      bpiDefenseRank:
        data.bpidefenserank ?? findPowerIndexStat(stats, "bpidefenserank"),
      strengthOfSchedule: findPowerIndexStat(stats, "sospast"),
      strengthOfScheduleRank: findPowerIndexStat(stats, "sospastrank"),
      strengthOfRecord: findPowerIndexStat(stats, "sor"),
      strengthOfRecordRank: findPowerIndexStat(stats, "sorrank"),
    };
  } catch (err) {
    console.warn(`[espn-stats] Error fetching power index for ${espnId}:`, err);
    return EMPTY_POWER_INDEX;
  }
}

/**
 * Fetch stats for a single team from ESPN.
 */
async function fetchTeamStats(
  espnId: string,
  apRankings?: Map<string, number>,
  season?: number,
): Promise<TeamStats> {
  const [statistics, powerIndex] = await Promise.all([
    fetchTeamStatistics(espnId, season),
    fetchTeamPowerIndex(espnId, season),
  ]);

  // The team info endpoint doesn't support ?season (always returns
  // current-season data). Call it when no season is specified or when the
  // requested season matches the current NCAA season (year of the spring
  // semester, i.e. current year if Jan-Jun, next year if Jul-Dec).
  const now = new Date();
  const currentNcaaSeason =
    now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  const isCurrentSeason = !season || season === currentNcaaSeason;
  const info = isCurrentSeason ? await fetchTeamInfo(espnId) : null;

  return {
    espnId,
    overallWins: statistics.overallWins ?? info?.overallWins ?? null,
    overallLosses: statistics.overallLosses ?? info?.overallLosses ?? null,
    conferenceWins: info?.conferenceWins ?? null,
    conferenceLosses: info?.conferenceLosses ?? null,
    conferenceName: statistics.conferenceName ?? info?.conferenceName ?? null,
    oppPpg: statistics.oppPpg ?? info?.oppPpg ?? null,
    ppg: statistics.ppg,
    fgPct: statistics.fgPct,
    threePtPct: statistics.threePtPct,
    ftPct: statistics.ftPct,
    reboundsPerGame: statistics.reboundsPerGame,
    assistsPerGame: statistics.assistsPerGame,
    stealsPerGame: statistics.stealsPerGame,
    blocksPerGame: statistics.blocksPerGame,
    turnoversPerGame: statistics.turnoversPerGame,
    apRanking: apRankings?.get(espnId) ?? null,
    bpi: powerIndex.bpi,
    bpiOffense: powerIndex.bpiOffense,
    bpiDefense: powerIndex.bpiDefense,
    bpiRank: powerIndex.bpiRank,
    bpiOffenseRank: powerIndex.bpiOffenseRank,
    bpiDefenseRank: powerIndex.bpiDefenseRank,
    strengthOfSchedule: powerIndex.strengthOfSchedule,
    strengthOfScheduleRank: powerIndex.strengthOfScheduleRank,
    strengthOfRecord: powerIndex.strengthOfRecord,
    strengthOfRecordRank: powerIndex.strengthOfRecordRank,
  };
}

/**
 * Fetch stats for all teams in a list. Includes 50ms delay between
 * teams to avoid hammering ESPN's API.
 */
export async function fetchAllTeamStats(
  espnIds: string[],
  onProgress?: (completed: number, total: number, teamName?: string) => void,
  season?: number,
): Promise<TeamStats[]> {
  const apRankings = await fetchAPRankings(season);
  const results: TeamStats[] = [];

  for (let i = 0; i < espnIds.length; i++) {
    const stats = await fetchTeamStats(espnIds[i], apRankings, season);
    results.push(stats);
    onProgress?.(i + 1, espnIds.length);

    // Rate limit
    if (i < espnIds.length - 1) {
      await delay(50);
    }
  }

  return results;
}
