# ESPN Power Index API Research

## Endpoint

```
https://sports.core.api.espn.com/v2/sports/basketball/leagues/mens-college-basketball/seasons/{year}/powerindex?limit=100&page={page}
```

This is a **different base URL** (`sports.core.api.espn.com`) than the existing ESPN integration which uses `site.api.espn.com`.

## Response Structure

The response is paginated. Each item in the `items` array contains stat objects with this shape:

```json
{
  "name": "sor",
  "displayName": "Strength of Record",
  "description": "...",
  "value": 0.0005,
  "displayValue": "0.0005"
}
```

The `team` field in each entry is a `$ref` URL (e.g., `https://sports.core.api.espn.com/v2/sports/basketball/leagues/mens-college-basketball/seasons/2025/teams/52`) rather than inline team data. You'll need to extract the team ID from the URL path to cross-reference with existing teams in the DB (which store `espnId`).

## Available Fields

### Strength of Record (SOR)

- `sor` — numerical value (e.g., 0.0005)
- `sorrank` — national ranking as string (e.g., "4th")

### Strength of Schedule (SOS)

- `sospast` — past schedule difficulty (e.g., 0.2689)
- `sospastrank` — SOS national ranking (e.g., "34th")
- `sosoutofconfpast` — non-conference SOS
- `sosoutofconfpastrank` — non-conference SOS ranking
- `sosremrank` — remaining schedule strength ranking

### BPI (Basketball Power Index)

- `bpi` — overall BPI value (expected point margin per 70 possessions)
- `bpirank` — national BPI ranking
- `bpioffense` / `bpioffenserank` — offensive component
- `bpidefense` / `bpidefenserank` — defensive component

### Tournament Projections

- `projectedtournamentseed`, `projectedtournamentorder`, `projectedtournamentseedactual`
- `chanceroundof32`, `chancesweet16`, `chanceelite8`, `chancefinal4`, `chancechampgame`, `chancencaachampion`

### Quality Wins

- `top50bpiwins`, `top50bpilosses`, `qualitywinpct`

### Win/Loss Projections

- `projtotalwins`, `projtotallosses`, `projovrwinpct`
- `projconfwins`, `projconflosses`, `projovrconfwinpct`

## Pagination

Use `limit` and `page` query params. Example:

- Page 1: `?limit=100&page=1`
- Page 2: `?limit=100&page=2`
- etc.

There are 350+ D1 teams, so expect ~4 pages at limit=100.

## Existing Codebase Context

### Current ESPN integration files

- `lib/espn-sync/espn-adapter.ts` — scoreboard API fetching & game parsing
- `lib/espn-sync/espn-team-stats.ts` — team stats & rankings fetching (uses `site.api.espn.com`)
- `lib/espn-sync/espn-types.ts` — TypeScript types for ESPN API responses
- `lib/espn-sync/sync.ts` — orchestrates syncing games to DB

### Current team stats schema (`lib/db/schema.ts`)

The `teamStats` table already stores per-team stats (PPG, opponent PPG, FG%, 3PT%, FT%, rebounds, assists, steals, blocks, turnovers, conference record, AP rank). SOS/SOR/BPI fields would need to be added via a new Drizzle migration.

### How team stats are fetched today (`lib/espn-sync/espn-team-stats.ts`)

- `fetchTeamStats(espnId, season?)` — fetches from `/teams/{espnId}/statistics`
- `fetchAllTeamStats(teams, season?)` — iterates all teams with 50ms delay between requests
- `fetchAPRankings(season?)` — fetches from `/rankings`
- These all use `site.api.espn.com` base URL

### API route that triggers stat sync

- `app/api/sync-team-stats/route.ts` — called by cron or admin to refresh team stats

### Rate limiting convention

Current code uses 50ms delay between per-team requests. The power index endpoint returns all teams in paginated bulk, so per-team delays aren't needed — just page through the results.

### User-Agent convention

Current code sends `User-Agent: Bracketsball/1.0` header on all ESPN requests.
