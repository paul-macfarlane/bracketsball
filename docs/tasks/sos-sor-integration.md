# Task: Add SOS & SOR from ESPN Power Index API

**Story:** Ad-hoc feature request (not in backlog)
**Status:** ready-for-review
**Branch:** main (direct)

## Plan

- [x] Research ESPN Power Index API for SOS/SOR availability
- [x] Add DB schema columns: `strength_of_schedule_rank`, `strength_of_record`, `strength_of_record_rank`
- [x] Extend `fetchTeamPowerIndex` to parse SOS/SOR from stats array
- [x] Wire SOS/SOR through sync, types, validators, queries, and UI
- [x] Add SOS/SOR to team comparison dialog with correct direction (lower = better)
- [x] Add SOS/SOR as stat weight options in bracket auto-fill
- [x] Fix SOS/SOR direction bugs (lower = better for both)
- [x] Output research file for BPI session

## Changes Made

- `lib/db/tournament-schema.ts`: Added `strengthOfScheduleRank`, `strengthOfRecord`, `strengthOfRecordRank` columns
- `lib/espn-sync/espn-team-stats.ts`: Renamed `fetchTeamBPI` to `fetchTeamPowerIndex`, extended to parse `sor`, `sorrank`, `sospast`, `sospastrank` from ESPN stats array. Added SOS/SOR fields to `TeamStats` interface.
- `lib/espn-sync/sync-team-stats.ts`: Added SOS/SOR fields to `buildStatsUpdate`
- `components/bracket/types.ts`: Added `strengthOfScheduleRank`, `strengthOfRecord`, `strengthOfRecordRank` to `TeamStats`
- `lib/validators/tournament.ts`: Added SOS rank, SOR, SOR rank to admin edit validator
- `lib/validators/bracket-entry.ts`: Added `strengthOfSchedule`, `strengthOfRecord` to `statWeightsSchema`
- `lib/db/queries/tournaments.ts`: Added new fields to select and update type
- `app/(app)/pools/[id]/brackets/actions.ts`: Pass new fields through to bracket teams
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Pass new fields through to bracket teams
- `app/(app)/admin/tournaments/[id]/teams/page.tsx`: Pass new fields to edit stats button
- `app/(app)/admin/tournaments/[id]/teams/edit-team-stats-button.tsx`: Added SOS Rank, SOR, SOR Rank form fields
- `components/bracket/team-comparison.tsx`: Added SOS Rank, SOR, SOR Rank display rows; fixed direction (lower = better)
- `lib/bracket-auto-fill.ts`: Added `strengthOfSchedule` and `strengthOfRecord` to `StatWeights`, `STAT_CATEGORIES` (inverted, "Strength" group), and all presets
- `components/bracket/stats-auto-fill-dialog.tsx`: Added new keys to `WEIGHT_KEYS`
- `docs/technical/espn-power-index-api-research.md`: Research output for BPI session
- `lib/db/migrations/0016_medical_mister_sinister.sql`: Added `IF NOT EXISTS` guards

## Verification

- Self-code review: done (1 issue found and fixed — migration missing `IF NOT EXISTS` guards)
- Format: pass (no changes)
- Lint: pass (2 pre-existing issues in unrelated files: `team-logo.tsx`, `scoring.test.ts`)
- Build: pass
- Knip: pass (1 pre-existing unused export in unrelated `bracket-full-view.tsx`)
- Tests: pass (61/61)
- Direction correctness: verified against live ESPN data — lower SOS/SOR raw values = better, confirmed by rank correlation (Duke: SOS 0.2542 = rank #13, SOR 0.0000081 = rank #3)
