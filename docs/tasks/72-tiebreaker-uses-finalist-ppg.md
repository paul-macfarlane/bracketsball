# Task: Tiebreaker Uses Championship Finalists' PPG for All Strategies

**Story:** #72 from backlog.md
**Status:** done
**Branch:** fix/tiebreaker-finalist-ppg

## Plan

- [x] Remove strategy gate from `generateTiebreaker` so all strategies use finalist PPG when available
- [x] Remove unused `strategy` parameter from `generateTiebreaker` function signature and call site
- [x] Verify build passes

## Changes Made

- `lib/bracket-auto-fill.ts`: Removed the `strategy === "stats_custom"` condition from `generateTiebreaker` so it always attempts to use the championship finalists' PPG. Removed the unused `strategy` parameter. Falls back to random 100-180 only when stats are unavailable.
