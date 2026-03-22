# Task: Configurable Region Bracket Positions

**Story:** N/A — Enhancement to support historical tournament variation
**Status:** done
**Branch:** main

## Context

NCAA tournament Final Four matchups are not always the same (e.g., sometimes East vs Midwest, sometimes East vs South). The bracket positions (which region goes where) need to be configurable per tournament.

## Plan

- [X] Add 4 bracket position columns to tournament table
- [X] Generate migration
- [X] Add validation for bracket positions
- [X] Update tournament queries to return new columns
- [X] Add admin UI for configuring bracket positions
- [X] Update bracket generation to use configured positions
- [X] Update bracket display to use configured positions
- [X] Update seed script

## Decisions

### Storage approach

**Context:** Need to store which region goes in each bracket position
**Decision:** 4 nullable text columns on tournament table (topLeft, bottomLeft, topRight, bottomRight) using the existing region enum. Nullable with no defaults so admin must explicitly configure. Left-side regions play each other in FF, right-side regions play each other.
**Alternatives considered:** Separate config table, JSON column. Too complex for 4 values.

## Changes Made

- `lib/db/tournament-schema.ts`: Added 4 bracket position columns (bracketTopLeftRegion, bracketBottomLeftRegion, bracketTopRightRegion, bracketBottomRightRegion)
- `lib/db/migrations/0006_low_bedlam.sql`: Migration to add the columns
- `lib/validators/tournament.ts`: Added bracketPositionsSchema with uniqueness validation
- `lib/db/queries/tournaments.ts`: Updated updateTournament to accept position fields
- `app/(app)/admin/tournaments/actions.ts`: Added updateBracketPositionsAction server action
- `app/(app)/admin/tournaments/[id]/bracket-positions-form.tsx`: New client component for configuring positions
- `app/(app)/admin/tournaments/[id]/page.tsx`: Added BracketPositionsForm to tournament detail page
- `app/(app)/admin/tournaments/[id]/games/actions.ts`: Updated bracket generation to use configured positions (requires positions set before generating)
- `components/bracket/bracket-full-view.tsx`: Made region layout configurable via bracketPositions prop (with backwards-compatible default)
- `components/bracket/bracket-editor.tsx`: Pass-through bracketPositions prop
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Fetch tournament data and pass bracket positions to editor
- `scripts/seed-tournament.ts`: Set bracket positions when seeding, use them for Final Four generation

## Verification

- Format: run
- Lint: pass
- Build: pass
