# Task: Show Game Time & Period on Live "What I Need" Games

**Story:** #77 from backlog.md
**Status:** done
**Branch:** feat/what-i-need-live-game-time

## Plan

- [x] Add backlog item (#77)
- [x] Create task file
- [x] Pass `statusDetail` from server to `WhatINeedCard` client component
- [x] Pass `statusDetail` through `computeWhatINeed` into `WhatINeedGame`
- [x] Display `statusDetail` in `DesktopGameRow` next to the "Live" badge
- [x] Display `statusDetail` in `MobileGameCard` next to the "Live" badge
- [x] Verify build passes (`pnpm build`)
- [x] Verify tests pass (`pnpm test`)
- [x] Run /pre-review

## Changes Made

- `docs/business/backlog.md`: Added story #77 with acceptance criteria and summary table entry
- `lib/what-i-need.ts`: Added `statusDetail` to `WhatINeedGame` interface and `GameInput` interface; pass it through in `computeWhatINeed`
- `app/(app)/pools/[id]/page.tsx`: Include `statusDetail` in serialized game data passed to client
- `components/pool/what-i-need-card.tsx`: Added `statusDetail` to `GameInput` interface; display it next to the "Live" badge in both `DesktopGameRow` and `MobileGameCard` layouts; added `formatGameTime` helper and display of scheduled game date/time for upcoming games

## Notes

- The `statusDetail` field already exists on the `tournamentGame` table and is synced from ESPN (e.g., "1st Half 12:34", "Halftime", "2nd Half 5:00")
- It's already used in the bracket matchup cards (`components/bracket/matchup-card.tsx` line 262) — just not in the "What I Need" component
- The `getTournamentGames` query already selects `statusDetail` (line 210 in `lib/db/queries/tournaments.ts`)
- No database migration or ESPN sync changes needed

## Verification

- Self-code review: done (no issues found)
- Format: run (no changes)
- Lint: 1 pre-existing error in `team-logo.tsx`, 1 pre-existing warning in `bracket-full-view.tsx` — not related to this task
- Build: pass
- Knip: 1 pre-existing unused export (`RoundPointsSummary` in `bracket-full-view.tsx`) — not related to this task
- Tests: pass (61/61)
- Acceptance criteria: all 7 met
