# Task: Bracket Lock at Round of 64 Start

**Story:** #46 from backlog.md
**Status:** ready-for-review
**Branch:** feature/46-bracket-lock-r64

## Plan

- [x] Step 1: DB schema migration — add `bracketLockTime` and `bracketLockTimeManual` to tournament table
- [x] Step 2: Replace `hasTournamentStarted()` with time-based check, add `getBracketLockTime()`
- [x] Step 3: Auto-calculate lock time from earliest R64 game `startTime` during ESPN sync
- [x] Step 4: Admin UI for manual override of lock time
- [x] Step 5: Verify lock scope covers all required actions, fix `joinPublicPool()` inline check
- [x] Step 6: Countdown timer component
- [x] Step 7: Integrate countdown timer into bracket editor and pool detail pages
- [x] Step 8: Verify draft bracket behavior at lock time (existing architecture handles this — drafts remain visible but locked)
- [x] Step 9: Per-game locking — individual started games locked while others remain interactive
- [x] Step 10: Auto-fill skips started games, propagates actual winners downstream
- [x] Step 11: Submit validation only counts pickable (scheduled) games
- [x] Step 12: Rank display in bracket editor and viewer headers

## Open Questions

- (Resolved) Lock scope: All app-wide actions locked at R64 start — confirmed by user
- (Resolved) First Four: Not locked, users can still edit during First Four games
- (Resolved) Draft brackets: Remain visible but permanently locked as incomplete
- (Resolved) Admin override: Admin can manually adjust lock time
- (Resolved) First Four picks: Users pick First Four winners, those flow into R64 slots. If their pick loses, downstream picks are just wrong (ESPN/option a approach)

## Decisions

### Time-based lock vs game-status-based lock

**Context:** Current `hasTournamentStarted()` checks if any game has moved off "scheduled" status, which triggers at First Four start — too early.
**Decision:** Store `bracketLockTime` (timestamp) on tournament table, derived from earliest R64 game `startTime`. Check `now >= bracketLockTime` instead of game statuses.
**Alternatives considered:** Could check only R64 game statuses, but a scheduled time is more predictable and allows admin override.

### Manual override flag

**Context:** ESPN sync auto-calculates `bracketLockTime` from R64 schedule. Admin needs ability to override without sync reverting it.
**Decision:** Add `bracketLockTimeManual` boolean flag. When true, ESPN sync skips auto-calculation. Admin UI has "Reset to Auto" to clear the flag.
**Alternatives considered:** Could use a separate `bracketLockTimeOverride` column, but a flag is simpler.

### Per-game locking (two-tier system)

**Context:** Before the global R64 lock time, First Four games may already be in progress or final. Users should still be able to pick other games but not modify started ones.
**Decision:** Two-tier locking: (1) Per-game: games with status `in_progress` or `final` are individually locked for picks, compare, and enter view mode. (2) Global: once `bracketLockTime` passes, all games are locked and enter view mode.
**Alternatives considered:** Could have kept a single global lock, but that would prevent users from making picks during First Four games.

## Changes Made

- `lib/db/tournament-schema.ts`: Added `bracketLockTime` (nullable timestamp) and `bracketLockTimeManual` (boolean, default false) columns to tournament table
- `lib/db/migrations/0014_adorable_grey_gargoyle.sql`: Migration adding the two new columns
- `lib/db/queries/pools.ts`: Rewrote `hasTournamentStarted()` to use time-based check against `bracketLockTime`. Added `getBracketLockTime()` export. Fixed inline game-status check in `joinPublicPool()` — moved check before transaction. Removed unused imports.
- `lib/db/queries/tournaments.ts`: Extended `updateTournament()` data parameter to accept `bracketLockTime` and `bracketLockTimeManual`
- `lib/espn-sync/sync.ts`: Added `updateBracketLockTimeFromSchedule()` that auto-calculates `bracketLockTime` from earliest R64 game `startTime` after each sync (skips if `bracketLockTimeManual` is true)
- `lib/bracket-auto-fill.ts`: Skip started games during auto-fill but record actual winners in pickMap so downstream games can resolve teams
- `lib/utils.ts`: Added shared `formatOrdinal()` utility for rank display
- `app/(app)/admin/tournaments/actions.ts`: Added `updateBracketLockTimeAction()` and `resetBracketLockTimeAction()` server actions for admin override
- `app/(app)/admin/tournaments/[id]/bracket-lock-time-form.tsx`: New client component for admin to view/override/reset bracket lock time
- `app/(app)/admin/tournaments/[id]/page.tsx`: Integrated `BracketLockTimeForm` into tournament detail page
- `components/countdown-timer.tsx`: New client component showing live countdown to lock time, or "Brackets are locked" message
- `components/bracket/bracket-editor.tsx`: Added `bracketLockTime` and `rankInfo` props, integrated `CountdownTimer`, added rank display in header
- `components/bracket/bracket-viewer.tsx`: Added `rankInfo` prop, added rank display in header
- `components/bracket/bracket-full-view.tsx`: Removed `tournamentStarted` prop from all sub-components and local computation — per-game locking handled inside `MatchupCard`
- `components/bracket/matchup-card.tsx`: Changed `canPick`, `viewMode`, and `showCompare` to per-game logic based on `gameStatus` and `disabled`. Removed unused `tournamentStarted` prop.
- `components/bracket/use-bracket-picks.ts`: `totalGames` and `pickedGames` now only count scheduled (pickable) games
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Fetch `bracketLockTime`, standings for rank info, pass to editor/viewer
- `app/(app)/pools/[id]/brackets/actions.ts`: Added per-game status check in `savePickAction`. Updated `submitBracketAction` to only count pickable games for completion validation.
- `app/(app)/pools/[id]/page.tsx`: Fetch and display `CountdownTimer` on pool detail page
- `docs/business/backlog.md`: Added story #46 as MVP, updated summary table and counts

## Verification

- Self-code review: done (1 issue found and fixed — extracted duplicate `formatOrdinal` to `lib/utils.ts`)
- Format: pass
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met, plus additional user-requested features (per-game locking, auto-fill fix, submit fix, rank display)
