import type { TournamentRound, TournamentRegion } from "./types";

interface HeadlineResult {
  round: TournamentRound | null;
  region: TournamentRegion | null;
}

const ROUND_MAP: Record<string, TournamentRound> = {
  "first four": "first_four",
  "1st round": "round_of_64",
  "2nd round": "round_of_32",
  "sweet 16": "sweet_16",
  "elite eight": "elite_8",
  "elite 8": "elite_8",
  semifinal: "final_four",
  "final four": "final_four",
  "national championship": "championship",
  championship: "championship",
};

const REGION_MAP: Record<string, TournamentRegion> = {
  south: "south",
  east: "east",
  west: "west",
  midwest: "midwest",
};

/**
 * Parses an ESPN notes headline like:
 *   "Men's Basketball Championship - South Region - 1st Round"
 *   "Men's Basketball Championship - Final Four"
 *   "Men's Basketball Championship - National Championship"
 * into round and region.
 *
 * The headline always starts with "Men's Basketball Championship - ",
 * so we strip that prefix before matching round keywords to avoid
 * false-matching "championship" from the prefix.
 */
export function parseHeadline(headline: string): HeadlineResult {
  const lower = headline.toLowerCase();

  let round: TournamentRound | null = null;
  let region: TournamentRegion | null = null;

  // Extract region — check longer names first so "midwest region"
  // isn't matched by "west region" as a substring
  const regionKeys = Object.keys(REGION_MAP).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of regionKeys) {
    if (lower.includes(`${key} region`)) {
      region = REGION_MAP[key];
      break;
    }
  }

  // Strip the common prefix so "championship" in
  // "Men's Basketball Championship" doesn't false-match.
  // After stripping, we get e.g. "south region - 1st round" or "national championship"
  const stripped = lower.replace(/^men's basketball championship\s*-\s*/, "");

  // Extract round — check longer phrases first to avoid partial matches
  const sortedKeys = Object.keys(ROUND_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (stripped.includes(key)) {
      round = ROUND_MAP[key];
      break;
    }
  }

  return { round, region };
}
