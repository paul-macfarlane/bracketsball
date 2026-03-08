# Sports Data Source Research

**Date:** 2026-03-07
**Purpose:** Evaluate data sources for NCAA Tournament bracket/game data to support Epic 6 (Sports Data Sync).

---

## Data Requirements

From the backlog and vision docs, we need:

| Data                                                     | Purpose                        |
| -------------------------------------------------------- | ------------------------------ |
| Tournament bracket structure (regions, rounds, matchups) | Build the bracket UI for picks |
| Team info (name, seed, abbreviation, logo)               | Display teams in bracket       |
| Game scores (each team's score)                          | Score bracket entries          |
| Game status (scheduled, in-progress, final)              | Drive live updates and scoring |
| Game schedule (date, time)                               | Show game times, lock picks    |
| Game location (city, state)                              | Display in game detail         |

---

## Option 1: ESPN Hidden API (Recommended)

### Overview

ESPN exposes undocumented JSON endpoints at `site.api.espn.com` that power their website and apps. Free, no auth required. Widely used by the open-source community for years.

### Key Endpoints

| Endpoint     | URL                                                                                                             | Purpose                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Scoreboard   | `site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&dates=YYYYMMDD` | All games for a given day    |
| Game Summary | `site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/summary?event={eventId}`              | Detailed single-game data    |
| Teams        | `site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams`                                | All teams with logos, colors |

### Data Coverage vs. Requirements

| Requirement       | Available?      | How                                                                                                                                                                                                                  |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bracket structure | Yes (assembled) | `competitions[].notes[].headline` contains region + round (e.g., "Men's Basketball Championship - South Region - 1st Round"). No single bracket endpoint — must query each tournament day's scoreboard and assemble. |
| Team info         | Yes             | `team.displayName`, `team.abbreviation`, `team.color`, `team.logo`                                                                                                                                                   |
| Seeds             | Yes             | `competitors[].curatedRank.current` (1-16)                                                                                                                                                                           |
| Game scores       | Yes             | `competitors[].score`, `linescores[]` for period-by-period                                                                                                                                                           |
| Game status       | Yes             | `status.type.name` ("STATUS_FINAL", "STATUS_SCHEDULED", "STATUS_IN_PROGRESS"), `status.type.state` ("pre"/"in"/"post"), `displayClock`, `period`                                                                     |
| Game schedule     | Yes             | `date` (ISO 8601), `broadcasts[]` for TV network                                                                                                                                                                     |
| Game location     | Yes             | `venue.fullName`, `venue.address.city`, `venue.address.state`                                                                                                                                                        |
| Team logos        | Yes             | `team.logo` URL (e.g., `https://a.espncdn.com/i/teamlogos/ncaa/500/{teamId}.png`), multiple variants available                                                                                                       |

### Identifying Tournament Games

- `competitions[].tournamentId === 22` and `type.abbreviation === "TRNMNT"`
- Round parsed from `notes[].headline` — pattern: "Men's Basketball Championship - {Region} - {Round}"

### Sync Strategy

- **Pre-tournament (Selection Sunday):** Fetch scoreboard for First Four + R64 dates to get all 68 teams, seeds, regions, initial matchups
- **During tournament:** Cron every 5-15 min on game days, fetch that day's scoreboard
- **Tournament dates (~12 days):** First Four (2 days), R64 (2 days), R32 (2 days), Sweet 16 (2 days), Elite 8 (2 days), Final Four (1 day), Championship (1 day)
- At most ~12 requests per full sync cycle — very light load

### Pros

- **Complete data** — covers every requirement including logos, colors, and broadcast info
- **Rich response** — team leaders, records, statistics all available as bonuses
- **Community-proven** — stable for years, used by hoopR, sportsdataverse, and many bracket apps
- **No auth required** — no API keys to manage
- **Low request volume** — ~12 requests per sync for the entire tournament

### Cons

- **Undocumented** — no official support, SLA, or versioning guarantees
- **No single bracket endpoint** — must assemble bracket from daily scoreboards (a legacy bracketology endpoint broke after 2021)
- **Response structure could change** — need defensive parsing
- **Rate limits unknown** — community consensus is thresholds are high, but not documented

### Risk Mitigation

- Cache responses aggressively (scores don't need sub-minute refresh for a pool app)
- Defensive parsing with graceful fallback for missing fields
- Error alerting on sync failures
- Manual entry fallback (Option 4) as emergency backup

---

## Option 2: NCAA Data API (data.ncaa.com)

### Overview

The NCAA runs an undocumented JSON API at `data.ncaa.com/casablanca/` that powers ncaa.com. Free, no auth required. Also available via a community wrapper project (henrygd/ncaa-api) that can be self-hosted.

### Key Endpoints

| Endpoint      | URL                                                                                      | Purpose                      |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| Scoreboard    | `data.ncaa.com/casablanca/scoreboard/basketball-men/d1/{YYYY}/{MM}/{DD}/scoreboard.json` | All games for a given day    |
| Via wrapper   | `ncaa-api.henrygd.me/scoreboard/basketball-men/d1/{YYYY}/{MM}/{DD}`                      | Same data, cleaner format    |
| Schools Index | `ncaa-api.henrygd.me/schools-index`                                                      | All schools (for logos/info) |

### Data Coverage vs. Requirements

| Requirement       | Available?    | How                                                                              |
| ----------------- | ------------- | -------------------------------------------------------------------------------- |
| Bracket structure | Yes           | `bracketRound`, `bracketRegion`, `bracketId` — explicit fields, richer than ESPN |
| Team info         | Yes           | Multiple name formats (`char6`, `short`, `seo`, `full`), `seed`, conference      |
| Seeds             | Yes           | Explicit `seed` field                                                            |
| Game scores       | Yes           | `score`, `gameState`, `currentPeriod`, `finalMessage`                            |
| Game status       | Yes           | `gameState`, `contestClock`                                                      |
| Game schedule     | Yes           | `startTime`, `startTimeEpoch`, `startDate`, `network`                            |
| Game location     | Partial       | Less venue detail than ESPN                                                      |
| Team logos        | No (directly) | Not in scoreboard response; would need separate source or static mapping         |

### henrygd/ncaa-api Wrapper

- Open source (MIT), can be self-hosted via Docker
- Clean JSON with OpenAPI documentation
- Public instance rate limit: 5 req/sec per IP
- Additional endpoints: game detail, boxscore, play-by-play, monthly schedules

### Pros

- **Authoritative source** — this is the NCAA's own data
- **Better bracket fields** — explicit `bracketRound`, `bracketRegion`, `bracketId` (no parsing from headlines needed)
- **Self-hostable wrapper** — henrygd/ncaa-api removes dependency on third-party uptime
- **No auth required**

### Cons

- **Undocumented** — same risk as ESPN (no SLA, could change)
- **No team logos** in scoreboard response (need separate source)
- **Less rich responses** — no team colors, leader stats, or broadcast info
- **Venue data is thinner** — less location detail than ESPN
- **No single bracket endpoint** — still must assemble from daily scoreboards
- **Smaller community** — fewer open-source projects depend on it than ESPN

---

## Option 3: TheSportsDB / Other Free APIs

### TheSportsDB

- **Not viable** — searched their API and NCAA basketball / March Madness returns no results. Coverage is professional leagues only (NBA, European basketball).

### SportsDataIO

- Has excellent NCAA tournament data including a Tournament Hierarchy endpoint
- **Not free** — free trial covers UEFA Champions League only, not NCAA basketball
- Paid plans start ~$30/month

### Sportradar

- Comprehensive NCAA tournament feeds
- **Commercial API** — requires paid license, not free

### API-Basketball (api-basketball.com)

- Free tier: 100 requests/day
- **Too restrictive** — during tournament play, 100 req/day is insufficient for timely sync

### Sports Reference

- No API — data available only via web scraping (fragile, slow, ToS violations)
- No bracket structure data
- **Not suitable** for live data

**Verdict:** No viable free alternative beyond ESPN and NCAA.

---

## Option 4: Manual Data Entry

### Overview

Build an admin UI where a system administrator manually inputs tournament data: teams, seeds, regions, game times, and scores.

### What Would Need To Be Built

| Feature                                       | Complexity                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Admin-only routes/auth                        | Low — leverage existing auth + role check                 |
| Team/seed entry form (68 teams, one-time)     | Medium — one-time data entry at start of tournament       |
| Game score entry form                         | Medium — need to update scores for ~67 games over 3 weeks |
| Game status management (scheduled/live/final) | Low — simple status toggle                                |
| Game schedule entry                           | Low — date/time inputs                                    |

### Volume Estimate

- **68 teams** to enter once (Selection Sunday)
- **67 games** total in the tournament to track
- **~4-8 games per day** on heavy days (R64 has the most at 16/day over 2 days)
- Total manual updates: ~135 score updates (one per team per game) + status changes

### Pros

- **Full control** — no dependency on external APIs
- **No breakage risk** — can't be affected by API changes
- **Simpler code** — no HTTP client, parsing, error handling for external data
- **Works for any year** — no concern about API endpoints changing season to season

### Cons

- **Manual labor** — someone must actively update scores during games, potentially multiple times per game for live scores
- **Latency** — scores are only as current as the last manual update (no live feel)
- **Error-prone** — typos in scores, missed games, wrong seeds
- **Doesn't scale** — if the app grows or supports more sports, this approach breaks down
- **Bad UX during live games** — users expect near-real-time score updates
- **Requires availability** — someone must be watching and updating during every game window

---

## Recommendation

### Primary: ESPN Hidden API (Option 1)

ESPN is the strongest choice for the following reasons:

1. **Most complete data** — every requirement is covered including logos, team colors, venue details, and broadcast info
2. **Largest community** — most open-source bracket projects use ESPN, so there are many examples and the endpoint has been stable for years
3. **Rich extras** — team leaders, stats, records, headlines are available for free, useful for future features
4. **Low request volume** — a bracket pool app only needs ~12 requests per full sync, well within any reasonable rate limit
5. **Already referenced** — the original vision doc and backlog already point to ESPN as the data source

### Fallback Plan

Build the sync layer with a clean abstraction so the data source can be swapped:

```
[Cron Job] → [Sync API Route] → [Data Source Adapter] → [DB Upsert]
                                        ↓
                                  ESPNAdapter (primary)
                                  NCAAAdapter (backup)
                                  ManualEntry (emergency)
```

1. **Primary:** ESPN Hidden API via `ESPNAdapter`
2. **If ESPN breaks:** Switch to NCAA data.ncaa.com via `NCAAAdapter` (bracket fields are actually better)
3. **Emergency:** Manual entry UI (Option 4) — only build this if both APIs fail; the volume is manageable for a single tournament

### Why Not NCAA as Primary?

The NCAA API has better bracket-specific fields (`bracketRound`, `bracketRegion`), but ESPN wins overall because:

- Team logos are included in the response (NCAA requires a separate source)
- Richer venue/broadcast/stats data
- Larger community means more proven reliability
- The headline-parsing for bracket info is straightforward and well-understood

### Implementation Approach

1. Define a `TournamentDataSource` interface (teams, games, scores, status)
2. Implement `ESPNAdapter` first (primary)
3. Build cron sync endpoint that uses the adapter to upsert tournament data
4. Defer `NCAAAdapter` and manual entry unless/until needed
5. Add monitoring/alerting on sync failures so we know quickly if ESPN breaks

### Estimated Effort

| Component                                            | Effort                |
| ---------------------------------------------------- | --------------------- |
| DB schema for tournament data (teams, games, scores) | Small                 |
| ESPN response types + parsing                        | Medium                |
| Sync endpoint + cron setup                           | Medium                |
| Data source adapter abstraction                      | Small                 |
| Error handling + monitoring                          | Small                 |
| **Total**                                            | **~1 story (Epic 6)** |
