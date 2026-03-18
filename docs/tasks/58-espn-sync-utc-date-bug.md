# Task: Fix ESPN Sync UTC Date Bug

**Story:** #58 (bug fix — not in backlog, discovered during live tournament)
**Status:** ready-for-review
**Branch:** fix/espn-sync-utc-date-bug

## Problem

The `/api/sync-espn` cron endpoint used `new Date().toISOString().split("T")[0]` to determine which date to query ESPN for. Since Vercel runs in UTC, evening ET games (e.g. 9 PM EDT = 1 AM UTC next day) would be missed once the UTC date rolled past midnight — the sync would query the next day's schedule, skipping in-progress or recently-finished games from the current ET day.

Additionally, ESPN returns `STATUS_HALFTIME` and `STATUS_END_PERIOD` during live games, but the status mapper only handled `STATUS_IN_PROGRESS` — halftime games were incorrectly mapped to `"scheduled"`.

## Plan

- [x] Fix sync endpoint to query both UTC today and yesterday
- [x] Fix status mapping for `STATUS_HALFTIME` and `STATUS_END_PERIOD`
- [x] Add `espnFetchMs` timing to `syncTournamentDateRange`
- [x] Verify build passes

## Changes Made

- `app/api/sync-espn/route.ts`: Changed from single-date `syncTournament(today)` to `syncTournamentDateRange(yesterday, today)` so the cron always covers the ET/UTC timezone boundary. Response JSON now returns `dates` array instead of single `date`.
- `lib/espn-sync/espn-adapter.ts`: Added `STATUS_HALFTIME` and `STATUS_END_PERIOD` to `mapStatus()` so halftime/end-of-period games stay as `"in_progress"` instead of reverting to `"scheduled"`.
- `lib/espn-sync/sync.ts`: Added `espnFetchMs` timing instrumentation to `syncTournamentDateRange` (was only on `syncTournament`).
