# Task: Hide No-Stake Games in "What I Need"

**Story:** #79 from backlog.md
**Status:** done
**Branch:** fix/hide-no-stake-what-i-need

## Plan

- [x] Add story #79 to backlog.md
- [x] Create task file
- [x] Filter out `rootFor === "none"` games in `computeWhatINeed` (`lib/what-i-need.ts`)
- [x] Remove "No stake" UI handling from `DesktopGameRow` and `MobileGameCard` (`components/pool/what-i-need-card.tsx`)
- [x] Update tests to reflect new filtering behavior (`lib/what-i-need.test.ts`)
- [x] Run lint, build, and tests

## Open Questions

- None

## Changes Made

- `lib/what-i-need.ts`: Added `if (rootFor === "none") continue;` before pushing games to results, filtering out games where the user has no stake
- `components/pool/what-i-need-card.tsx`: Removed `isNoStake` variable, opacity-50 styling, and "No stake" label from both `DesktopGameRow` and `MobileGameCard`; simplified time display conditions by removing `!isNoStake` guards
- `lib/what-i-need.test.ts`: Updated "shows 'none'" test to expect empty results (renamed to "excludes games when neither team is picked"); updated "shows 0 impact for eliminated team" test to expect empty results (renamed to "excludes game when only picked team is eliminated"); added pick for team 'e' in grouping test so elite_8 round has a stake and isn't filtered out
- `docs/business/backlog.md`: Added story #79 and updated summary table/counts

## Verification

- Build: passes
- Tests: 61/61 pass
- Knip: pre-existing issue only (unrelated `RoundPointsSummary` in bracket-full-view.tsx)
- Lint: pre-existing issues only (unrelated `team-logo.tsx` and `scoring.test.ts`)
