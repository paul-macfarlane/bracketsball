# Task: Admin Manual Team & Game Data Entry

**Story:** #38 from backlog.md
**Status:** ready-for-review
**Branch:** main

## Plan

- [x] Step 1: Fix ESPN sync to only write non-null venue/startTime fields
- [x] Step 2: Add Zod validators for team stats and game details
- [x] Step 3: Add updateTournamentTeamStats query function
- [x] Step 4: Add server actions for team stats and game details
- [x] Step 5: Create EditTeamStatsButton dialog component
- [x] Step 6: Add EditTeamStatsButton to tournament teams page
- [x] Step 7: Extend GameRow edit mode with venue/startTime fields

## Open Questions

None — requirements are clear from the story.

## Changes Made

- `lib/espn-sync/sync.ts`: Changed game sync to only write non-null startTime/venue fields from ESPN, preventing overwrite of manual edits
- `lib/validators/tournament.ts`: Added `updateTournamentTeamStatsSchema` (16 stats fields) and extended `updateGameSchema` with startTime, venueName, venueCity, venueState
- `lib/db/queries/tournaments.ts`: Added `updateTournamentTeamStats()` query function
- `app/(app)/admin/tournaments/actions.ts`: Added `updateTournamentTeamStatsAction` server action; updated `updateGameAction` to handle venue/startTime fields
- `app/(app)/admin/tournaments/[id]/teams/edit-team-stats-button.tsx`: New dialog component for editing all 16 team stats fields, organized in sections (Records, Scoring, Shooting, Per Game, Rankings)
- `app/(app)/admin/tournaments/[id]/teams/page.tsx`: Added EditTeamStatsButton alongside existing EditTeamButton
- `app/(app)/admin/tournaments/[id]/games/game-row.tsx`: Extended edit mode with startTime (datetime-local), venueName, venueCity, venueState inputs

## Decisions

### Removed unused updateGameDetailsAction

**Context:** Initially created a separate `updateGameDetailsAction` for venue/startTime-only updates, but the GameRow UI sends all fields (scores, status, venue, startTime) through `updateGameAction`.
**Decision:** Removed the unused action to avoid dead code.
**Alternatives considered:** Keeping it for potential future use, but dead code is worse than reimplementing if needed later.

### Used register() instead of watch() for stats form

**Context:** React Compiler lint warning about React Hook Form's `watch()` being incompatible with memoization.
**Decision:** Refactored to use `register()` with `setValueAs` for nullable number input handling, using `defaultValue` instead of controlled `value`.
**Alternatives considered:** Suppressing the lint warning, but using `register()` is more idiomatic and avoids the issue entirely.

## Verification

- Self-code review: done (found and fixed: removed unused `updateGameDetailsAction` and `updateTournamentGame` import; refactored `form.watch()` to `register()` pattern to fix React Compiler lint warning)
- Format: run
- Lint: pass (0 errors, 0 warnings)
- Build: pass (0 TypeScript errors)
- Tests: pass (22/22)
- Acceptance criteria: all met
  - Admin can edit all team stats fields on the tournament team admin page: YES (EditTeamStatsButton with dialog containing all 16 fields)
  - Admin can edit game details (start time, venue name, city, state): YES (GameRow edit mode extended with these fields)
  - Manual edits are not overwritten by ESPN sync: YES (sync.ts only writes non-null fields from ESPN)
  - Changes take effect immediately in the bracket builder comparison view: YES (server actions revalidatePath, team stats are already queried and displayed by the comparison dialog)
