# Task: Filter Pool Data by Active Tournament

**Story:** #47 from backlog.md
**Status:** ready-for-review
**Branch:** feature/47-filter-pool-data-by-tournament

## Plan

- [x] Add `tournamentId` param to `getBracketEntriesByPoolAndUser` query
- [x] Add `tournamentId` param to `getBracketEntryCountForUser` query
- [x] Add `tournamentId` param to `getMaxBracketCountForPool` query
- [x] Update pool detail page (`pools/[id]/page.tsx`) to pass `activeTournament.id`
- [x] Update create bracket action (`pools/[id]/brackets/actions.ts`) to pass `tournament.id`
- [x] Update `getMaxBracketCountInPool` wrapper in `pools.ts` to accept and pass `tournamentId`
- [x] Update pool settings page and actions to pass tournament ID
- [x] Run pre-review

## Verification

- Self-code review: done (no issues — `deleteBracketEntriesForMember` intentionally unchanged per decisions section)
- Format: pass
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met
  - Bracket list on pool detail page filters by active tournament
  - Bracket count checks only count entries for active tournament
  - All pool-scoped bracket queries audited and updated with `tournamentId` where appropriate
  - Standings already correct (no change needed)
  - No data deletion — previous entries remain in DB, just filtered from view
  - Future-compatible — `tournamentId` parameter approach supports querying any tournament

## Decisions

### Member removal deletes all tournaments' brackets (no change)

**Context:** `removePoolMember` and `leavePool` delete all bracket entries for a user in a pool without filtering by tournament.
**Decision:** Keep this behavior — leaving a pool should remove all participation across all tournaments.
**Alternatives considered:** Only delete active tournament brackets (would leave orphaned data from prior seasons).

### getMaxBracketCountForPool should be tournament-scoped

**Context:** This function is used to prevent pool leaders from lowering `maxBracketsPerUser` below the current highest count. Without tournament scoping, brackets from a prior tournament would block settings changes for the new one.
**Decision:** Add `tournamentId` filter so only the active tournament's bracket counts matter.

## Changes Made

- `lib/db/queries/bracket-entries.ts`: Added `tournamentId` parameter to `getBracketEntriesByPoolAndUser`, `getBracketEntryCountForUser`, and `getMaxBracketCountForPool`
- `lib/db/queries/pools.ts`: Updated `getMaxBracketCountInPool` to accept and pass `tournamentId`
- `app/(app)/pools/[id]/page.tsx`: Pass `activeTournament.id` to bracket entry queries
- `app/(app)/pools/[id]/brackets/actions.ts`: Pass `tournament.id` to `getBracketEntryCountForUser`
- `app/(app)/pools/[id]/settings/page.tsx`: Fetch active tournament and pass ID to `getMaxBracketCountInPool`
- `app/(app)/pools/[id]/settings/actions.ts`: Fetch active tournament and pass ID to `getMaxBracketCountInPool`
