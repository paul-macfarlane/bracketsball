# Task: Eliminated Champion Red X Indicator

**Story:** #75 from backlog.md
**Status:** done
**Branch:** feat/eliminated-champion-indicator

## Plan

- [x] Add eliminated team ID computation in `getPoolStandings`
- [x] Add `isChampionEliminated` to standings return data
- [x] Update `StandingsTable` and `ChampionDisplay` to render red X overlay
- [x] Update `BracketEntryRow` to render red X overlay
- [x] Pass `isChampionEliminated` from pool detail page to My Brackets section
- [x] Use `text-destructive` CSS variable instead of arbitrary color
- [x] Dim logo with opacity + grayscale when eliminated

## Changes Made

- `lib/db/queries/bracket-entries.ts`: Computed eliminated team IDs from completed games in `getPoolStandings`, added `isChampionEliminated` boolean to each standings entry
- `components/pool/standings-table.tsx`: Added `isChampionEliminated` to `StandingsEntry` interface, updated `ChampionDisplay` to render a lucide `X` icon overlay with `text-destructive` color and dim the logo with `opacity-40 grayscale`
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: Added `isChampionEliminated` prop, renders same red X overlay on champion logo
- `app/(app)/pools/[id]/page.tsx`: Extracts `isChampionEliminated` from standings data and passes it to `BracketEntryRow`
