# Task: Transaction Audit

**Story:** #21 from backlog.md
**Status:** ready-for-review
**Branch:** feature/tech-debt-cleanup

## Plan

- [x] Audit all files in lib/db/queries/ for multi-write functions missing transactions
- [x] Audit all server actions for multi-write calls missing transactions
- [x] Add DbClient parameter pattern to query functions needing transaction support
- [x] Wrap multi-write operations in transactions
- [x] Document the DbClient pattern in standards.md
- [x] Document all functions that were fixed

## Audit Results

Audited 70+ functions across 9 query files and 13 server action files.

**Compliance before fixes:** 85% — all query functions and server actions were properly transactional except 3 issues.

### Functions Fixed

1. **`syncStandingsForTournament`** in `lib/db/queries/standings.ts` (HIGH)
   - Had a loop of 100+ bracket entry updates with no transaction wrapping
   - Fixed: wrapped update loop in `db.transaction()`
   - Added `client: DbClient = db` parameter for composable transactions

2. **`syncBracketTeams`** in `app/(app)/admin/tournaments/actions.ts` (MEDIUM)
   - Had a loop of R64 game team updates with no transaction wrapping
   - Fixed: wrapped update loop in `db.transaction()`

3. **`updateBracketPositionsAction`** in `app/(app)/admin/tournaments/actions.ts` (MEDIUM)
   - Had two separate Final Four game source reference updates without transaction
   - Fixed: wrapped both updates in `db.transaction()`

### Already Correct (11 query functions, 11 server actions)

All other multi-write operations were already properly transactional. Functions that already support the `DbClient` pattern: `getBracketEntryById`, `getPicksForEntry`, `savePick`, `deletePicksForGames`, `updateTiebreaker`, `unsubmitBracketEntry`, `savePicksBatch`, `clearAllPicks`.

## Changes Made

- `lib/db/queries/standings.ts`: Wrapped update loop in transaction, added `DbClient` parameter
- `app/(app)/admin/tournaments/actions.ts`: Wrapped `syncBracketTeams` loop and `updateBracketPositionsAction` FF updates in transactions
- `docs/technical/standards.md`: Documented the `DbClient` pattern for composable transactions

## Verification

- Self-code review: done (1 issue found and fixed — reads in `syncStandingsForTournament` now use `client` instead of `db`)
- Format: clean
- Lint: pass
- Build: pass
- Knip: pass
- Tests: pass (22/22)
- Acceptance criteria: all met
