# Task: Unit Test Standings Sorting & Ranking + Full Tournament Scenario Tests

**Stories:** #52, #53 from backlog.md
**Status:** done
**Branch:** feature/scoring-standings-tests

## Plan

- [x] Extract sort + rank logic from `getPoolStandings()` into pure function in `lib/scoring.ts`
- [x] Write unit tests for standings sorting and ranking (#52)
- [x] Write full tournament scenario tests (#53)
- [x] Run all checks (lint, build, test, knip)

## Changes Made

- `lib/scoring.ts`: Added `sortAndRankStandings()` function and `StandingsEntry` interface — extracted from inline logic in `getPoolStandings()`
- `lib/db/queries/bracket-entries.ts`: Replaced inline sort + rank logic with `sortAndRankStandings()` call (behavior-preserving refactor)
- `lib/scoring.test.ts`: Added 22 new tests:
  - `sortAndRankStandings` suite: sorting (6 tests), ranking (5 tests), property preservation (1 test)
  - `full tournament scenarios` suite: early tournament, mid tournament, complete tournament with tiebreaker, upset-heavy, late tournament F4, multi-entry pool with 5 entries (6 tests)
- `docs/business/backlog.md`: Added stories #52, #53, #54

## Decisions

### Extract sort/rank as generic function with `<T extends StandingsEntry>`

**Context:** Needed to make the standings logic testable without a database
**Decision:** Used a generic type parameter so the function preserves extra properties from the input entries (userId, championPick, etc.)
**Alternatives considered:** Could have created a separate standings module, but keeping it in scoring.ts alongside calculateBracketScores keeps related logic together
