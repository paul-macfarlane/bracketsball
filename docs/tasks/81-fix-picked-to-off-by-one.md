# Task: Fix "Picked to" Off-by-One in What I Need

**Story:** #81 from backlog.md
**Status:** done
**Branch:** main

## Plan

- [x] Identify the off-by-one bug in `computeImpact` within `lib/what-i-need.ts`
- [x] Fix `furthestRound` to show the round a team advances TO (next round) instead of the game's round
- [x] Handle championship edge case — display "Picked to win Championship" for teams picked to win it all
- [x] Update unit tests to reflect corrected behavior
- [x] Add backlog entry (#81) and this task file

## Changes Made

- `lib/what-i-need.ts`: In `computeImpact`, changed `furthestRound` to map to the next round in `ROUND_ORDER` (the round a team advances to by winning), instead of the game's own round. For the championship game (last in `ROUND_ORDER`), uses the special value `"champion"`.
- `components/pool/what-i-need-card.tsx`: Updated display logic to show "Picked to win Championship" when `furthestRound === "champion"`, otherwise shows the standard `ROUND_LABELS` mapping.
- `lib/what-i-need.test.ts`: Updated the cumulative impact test assertion — `team1FurthestRound` now correctly expects `"championship"` instead of `"final_four"`.
- `docs/business/backlog.md`: Added story #81 and updated summary counts.

## Decisions

### Use "champion" sentinel value for championship game winner

**Context:** When a team is picked to win the championship game, there is no next round in `ROUND_ORDER` to advance to.
**Decision:** Use the string `"champion"` as a sentinel value, with the display component rendering it as "Picked to win Championship".
**Alternatives considered:** Could have kept `"championship"` and differentiated in the display by checking if the game round was also championship, but that would require passing additional context to the component.
