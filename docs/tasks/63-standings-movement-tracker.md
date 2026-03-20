# Task: Standings Movement Tracker

**Story:** #63 from backlog.md
**Status:** done
**Branch:** feat/standings-movement-tracker

## Plan

- [x] Create `standings_snapshot` schema and migration
- [x] Implement snapshot creation, round detection, and movement query functions
- [x] Wire round detection into ESPN sync pipeline
- [x] Create `MovementIndicator` UI component
- [x] Update `StandingsTable` and pool page to show movement
- [x] Run pre-review checks

## Decisions

### Separate table vs columns on bracket_entry

**Context:** Need to store historical standings per round (up to 7 rounds)
**Decision:** New `standings_snapshot` table with one row per entry per round
**Alternatives considered:** Adding `previousRank` column to `bracket_entry` — insufficient for multi-round history and future features like standings charts

### Round-scoped scoring for snapshots

**Context:** If deploying mid-tournament, backfill needs historically accurate snapshots
**Decision:** When snapshotting round N, only consider games from rounds <= N so scores are correct even during backfill
**Alternatives considered:** Using current total scores — would be inaccurate for past rounds

## Open Questions

(none)

## Changes Made

- `lib/db/standings-snapshot-schema.ts`: New table schema for standings snapshots per round
- `lib/db/schema.ts`: Export new schema
- `lib/db/migrations/0017_ambitious_warbound.sql`: Generated migration for standings_snapshot table
- `lib/db/queries/standings.ts`: Added `snapshotStandingsForRound`, `detectAndSnapshotCompletedRounds`, `getStandingsMovement`
- `lib/espn-sync/sync.ts`: Wire `detectAndSnapshotCompletedRounds` after standings sync
- `components/pool/movement-indicator.tsx`: New UI component for up/down/dash/NEW indicators
- `components/pool/standings-table.tsx`: Added movement column to desktop table and mobile list
- `app/(app)/pools/[id]/page.tsx`: Fetch movement data and pass to StandingsTable

## Verification

- Self-code review: done (no issues)
- Format: pass
- Lint: pass (1 pre-existing error in team-logo.tsx, not related)
- Build: pass
- Knip: pass (1 pre-existing unused export in bracket-full-view.tsx, not related)
- Tests: pass (61/61)
- Acceptance criteria: all met
