# Task: Show TBD for Unknown Game Times

**Story:** #78 from backlog.md
**Status:** done
**Branch:** fix/tbd-game-times

## Plan

- [x] Add backlog item (#78)
- [x] Create `lib/date-utils.ts` with `isMidnightET` detection and `formatGameDateTime` utility
- [x] Update `components/bracket/matchup-card.tsx` to use shared formatter
- [x] Update `components/pool/what-i-need-card.tsx` to use shared formatter
- [x] Update `components/bracket/team-comparison.tsx` to use shared formatter
- [x] Create task file
- [x] Verify build passes

## Decisions

### Detect at display time, not sync time

**Context:** We needed to decide whether to add a DB column (e.g., `timeTbd`) or detect midnight ET at render time.
**Decision:** Detect at display time by checking if the time is midnight Eastern.
**Alternatives considered:** Adding a boolean column to the DB — rejected because it adds migration complexity and the detection is reliable without it (NCAA tournament games never start at midnight ET).

### Shared formatting utility

**Context:** Game times were formatted independently in three components with slightly different formats and no TBD handling.
**Decision:** Created a single `formatGameDateTime` function in `lib/date-utils.ts` with an `includeWeekday` option for the team comparison dialog.
**Alternatives considered:** Keeping separate formatters — rejected because the inconsistency (`,` vs `·` separator) was accidental and TBD logic should be centralized.

## Changes Made

- `lib/date-utils.ts` (new): `isMidnightET()` helper using `Intl.DateTimeFormat` with `America/New_York` timezone (handles EST/EDT automatically); `formatGameDateTime()` shared formatter with optional `includeWeekday` param
- `components/bracket/matchup-card.tsx`: Replaced inline date/time formatting with `formatGameDateTime(startTime)`
- `components/pool/what-i-need-card.tsx`: Removed local `formatGameTime` function, now uses `formatGameDateTime` from shared utility
- `components/bracket/team-comparison.tsx`: Replaced inline formatting ("Fri, Mar 19 at 7:10 PM") with `formatGameDateTime(startTime, { includeWeekday: true })`
- `docs/business/backlog.md`: Added story #78 and updated summary table
