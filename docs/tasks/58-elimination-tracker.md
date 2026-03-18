# Task: Elimination Tracker

**Story:** #58 from backlog.md
**Status:** ready-for-review
**Branch:** main

## Plan

- [x] Add `getEliminationStatus()` utility function to `lib/scoring.ts`
- [x] Add unit tests for elimination logic in `lib/scoring.test.ts`
- [x] Update `StandingsTable` with elimination badges, row dimming, and contention toggle (1st / Top 2 / Top 3)
- [x] Pass `tournamentStarted` to `StandingsTable` from pool detail page
- [x] Add elimination badges to "My Brackets" list via `BracketEntryRow`
- [x] Add elimination banner to `BracketViewer` and `BracketEditor`
- [x] Compute elimination info in bracket detail page and pass to viewer/editor
- [x] Run verification checks (test, lint, build, knip)

## Decisions

### Client-side topN toggle only on standings table

**Context:** Users want to check contention for different placement targets
**Decision:** Toggle is only on standings table; My Brackets and bracket detail use topN=1
**Alternatives considered:** Toggle everywhere — rejected for simplicity

### No DB changes

**Context:** Elimination is derivable from existing totalPoints and potentialPoints
**Decision:** Pure client-side computation, no schema changes needed

## Changes Made

- `lib/scoring.ts`: Added `getEliminationStatus()` function
- `lib/scoring.test.ts`: Added 8 test cases for elimination logic
- `components/pool/standings-table.tsx`: Added contention toggle (1st/Top 2/Top 3), elimination badges (Alive/Eliminated), row opacity dimming, new Status column
- `app/(app)/pools/[id]/page.tsx`: Pass `tournamentStarted` to StandingsTable, compute elimination for My Brackets
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: Accept and display `isEliminated` prop
- `components/bracket/bracket-viewer.tsx`: Accept `eliminationInfo` prop, show elimination/contention banner
- `components/bracket/bracket-editor.tsx`: Accept `eliminationInfo` prop, show elimination/contention banner
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Compute elimination info and pass to viewer/editor
- `components/pool/elimination-badge.tsx`: New shared EliminationBadge component (Alive/Eliminated)
- `components/pool/elimination-banner.tsx`: New shared EliminationBanner component with EliminationInfo type

## Verification

- Self-code review: done — found 2 issues, both fixed:
  1. Arbitrary green Tailwind classes replaced with `success` CSS variable-based classes (`bg-success/10 text-success border-success/30`)
  2. Duplicated badge/banner logic extracted into shared components (`elimination-badge.tsx`, `elimination-banner.tsx`)
- Format: clean
- Lint: pass (2 pre-existing issues unrelated to this feature)
- Build: pass
- Knip: pass (1 pre-existing unused export unrelated to this feature)
- Tests: 61/61 pass (8 new elimination tests)
- Acceptance criteria: all 8 met
