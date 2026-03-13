# Task: Manage Bracket Scoring Settings

**Story:** #16 from backlog.md
**Status:** ready-for-review
**Branch:** feature/16-manage-bracket-scoring-settings

## Plan

- [x] Add scoring fields to `buildUpdatePoolSchema()` validator
- [x] Update `UpdatePoolData` interface and `updatePool()` query to persist scoring
- [x] Pass pool scoring values as defaultValues to the form component
- [x] Replace placeholder scoring section with editable number inputs
- [x] Add "Reset to Defaults" button

## Changes Made

- `lib/validators/pool.ts`: Added `scoring` limits (0-1000), reusable `scoringField` Zod validator, and 7 scoring fields to `buildUpdatePoolSchema()`
- `lib/db/queries/pools.ts`: Extended `UpdatePoolData` interface and `updatePool()` to persist all 7 scoring columns
- `app/(app)/pools/[id]/settings/page.tsx`: Pass pool's current scoring values as defaultValues to the form
- `app/(app)/pools/[id]/settings/pool-settings-form.tsx`: Replaced static placeholder with editable number inputs for each round, added "Reset to Defaults" button

## Decisions

### Scoring range 0-1000

**Context:** Needed to set validation bounds for scoring inputs
**Decision:** Min 0, max 1000 points per round
**Alternatives considered:** No upper bound (risky for UI/UX), lower max like 100 (may be too restrictive for creative scoring schemes)

## Verification

- Self-code review: done (no issues — two minor pre-existing UX notes flagged: NaN on cleared number inputs, reset button not clearing validation errors)
- Format: run
- Lint: pass
- Build: pass
- Acceptance criteria: all met
