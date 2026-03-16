# Task: ESPN Sync & Dark Mode Bug Fixes

**Story:** #51 from backlog.md
**Status:** done
**Branch:** feature/espn-sync-and-dark-mode-fixes

## Plan

- [x] Fix opponent PPG not populating during team stats sync
- [x] Fix dark mode team logos causing hydration mismatch
- [x] Move "Sync Team Stats" button from games to teams admin section
- [x] Reduce ESPN sync delays from 300-500ms to 50ms

## Changes Made

- `lib/espn-sync/espn-team-stats.ts`: Added `oppPpg` to `TeamStatisticsResult` interface and extraction from defensive stats category. Changed `fetchTeamInfo` to be called when the requested season matches the current NCAA season (not skipped whenever any season param is present). Reduced inter-request delay from 300ms to 50ms.
- `lib/espn-sync/espn-adapter.ts`: Reduced inter-request delay from 500ms to 50ms.
- `components/team-logo.tsx`: Added `mounted` state to defer theme-dependent logo src selection until after hydration, fixing React hydration mismatch.
- `app/(app)/admin/tournaments/[id]/teams/sync-team-stats-button.tsx`: Moved from games directory; updated import to use parent actions file.
- `app/(app)/admin/tournaments/[id]/teams/page.tsx`: Added SyncTeamStatsButton to teams page header.
- `app/(app)/admin/tournaments/[id]/games/page.tsx`: Removed SyncTeamStatsButton import and usage.
- `app/(app)/admin/tournaments/[id]/games/actions.ts`: Removed `syncTeamStatsAction` and unused `syncTeamStats` import.
- `app/(app)/admin/tournaments/actions.ts`: Added `syncTeamStatsAction` with revalidation pointing to teams page.
