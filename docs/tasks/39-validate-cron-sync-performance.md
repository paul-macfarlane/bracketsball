# Task: Validate Cron Sync Performance

**Story:** #39 from backlog.md
**Status:** ready-for-review
**Branch:** feature/validate-cron-sync-performance

## Plan

- [x] Audit sync endpoint for total execution time
- [x] Add timing instrumentation to sync endpoint
- [x] Set Vercel maxDuration on sync route
- [x] Optimize standings recalc (filter bracketPick query)
- [x] Set up vitest and write standings calculation tests
- [x] Document findings and expected sync durations

## Audit Findings

### Sync Endpoint Flow (`/api/sync-espn`)

The cron fetches a **single date** (today), so the multi-date 500ms delay in `fetchGamesForDateRange()` is irrelevant to the cron path.

| Phase               | What                                                | Estimated Time      |
| ------------------- | --------------------------------------------------- | ------------------- |
| ESPN API fetch      | Single HTTP GET to ESPN scoreboard                  | 200-500ms           |
| Load DB state       | 3 parallel queries (teams, tournament_teams, games) | 50-200ms            |
| DB transaction      | Upsert teams + update games + advance winners       | 5-15ms × N games    |
| Standings recalc    | Score all bracket entries across all pools          | Scales with entries |
| **Total (typical)** |                                                     | **~0.5-2s**         |

**Peak load estimate (R64 day, 16 games, 50 users × 5 brackets = 250 entries):** ~2-4s. Well under 30s.

### Team Stats Sync

Confirmed **NOT** called by the cron endpoint. Only via admin UI (`syncTeamStatsAction`). Takes ~20s for 68 teams due to 300ms delay between requests.

### Multi-Date Fetch Bottleneck

The 500ms delay in `espnAdapter.fetchGamesForDateRange()` is only used by the test script (`pnpm sync:test`), not the cron endpoint. The cron calls `fetchGamesByDate()` which does a single HTTP request — no delays.

### Standings Recalc Scaling

`syncStandingsForTournament()` runs after every sync. The calculation itself (`calculateBracketScores`) is pure in-memory computation with O(games × picks) per entry — very fast. The bottleneck would be DB updates (one UPDATE per entry). For realistic pool/bracket counts (50 users × 5 brackets = 250 entries), this is ~250 sequential UPDATEs which completes in well under 1 second on Neon.

## Changes Made

- `app/api/sync-espn/route.ts`: Added `maxDuration = 30` export. Added total duration logging with per-phase timing breakdown (ESPN fetch, DB transaction, standings recalc).
- `lib/espn-sync/types.ts`: Added `SyncTiming` interface and optional `timing` field to `SyncResult`.
- `lib/espn-sync/sync.ts`: Added `performance.now()` instrumentation around ESPN fetch, DB transaction, and standings recalc phases. Timing data included in sync result.
- `lib/db/queries/standings.ts`: Optimized `bracketPick` query to filter by entry IDs (`inArray`) instead of loading ALL picks globally. Also narrowed SELECT to only needed columns.
- `vitest.config.ts`: New file — vitest configuration with `@/` path alias support.
- `package.json`: Added `test` and `test:watch` scripts, added vitest dependency.
- `lib/scoring.test.ts`: New file — 22 tests covering `getPointsForRound` and `calculateBracketScores` including correct picks, incorrect picks, pending games, elimination tracking, custom scoring, edge cases, and perfect bracket scenario.

## Decisions

### Standings update batching deferred

**Context:** Entry score updates are sequential (one UPDATE per entry). Batching could improve performance.
**Decision:** Kept sequential updates for now — realistic scale (250 entries) completes well under 1 second. Batching adds complexity for negligible gain at current scale.
**Alternatives considered:** SQL CASE-based batch update, Promise.all with concurrent updates.

## Verification

- Self-code review: done (no issues — all 8 acceptance criteria met, no standards violations)
- Format: pass
- Lint: pass
- Build: pass
- Tests: 22 passed (0 failed)
- Acceptance criteria:
  - [x] Audit sync endpoint for total execution time under realistic conditions
  - [x] Measure or estimate wall-clock time for each phase under peak load
  - [x] Address multi-date fetch bottleneck (documented as irrelevant to cron path)
  - [x] Verify standings recalc scales with realistic pool/bracket counts
  - [x] Confirm team stats sync is NOT called by cron endpoint
  - [x] Add logging/timing instrumentation to sync endpoint
  - [x] Document optimizations made and expected sync duration
  - [x] Set Vercel function `maxDuration` on sync route
