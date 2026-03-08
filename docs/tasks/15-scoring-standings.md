# Task: Live Bracket Scoring & Standings

**Story:** #15 from backlog.md
**Status:** ready-for-review
**Branch:** feature/scoring-standings

## Plan

- [x] Add `totalPoints` and `potentialPoints` columns to `bracketEntry` table
- [x] Build scoring calculation logic in `lib/scoring.ts`
- [x] Create query functions for bulk score recalculation
- [x] Create admin server action for "Sync Standings"
- [x] Add "Sync Standings" button to admin tournament games page
- [x] Update bracket types to support game results and scoring info
- [x] Update `MatchupCard` to show correct/incorrect indicators and points
- [x] Update `BracketEditor` to show total points and potential points
- [x] Pass pool scoring settings through to bracket view
- [x] Use CSS variables for success/failure colors (not hardcoded Tailwind colors)
- [x] Update standards doc with CSS variable requirement
- [x] Lock create bracket and create invite actions after tournament starts (backend + UI)
- [x] Add chevron navigation affordance to bracket list items for mobile

## Decisions

### Store scores on bracketEntry table

**Context:** Need fast standings queries later
**Decision:** Add `totalPoints` and `potentialPoints` integer columns to `bracketEntry`, updated via admin sync button
**Alternatives considered:** On-demand calculation (too expensive for standings), event-driven (more complex, premature)

### Potential points = current points + points from games where picked team is still alive

**Context:** Need to define "potential points"
**Decision:** A team is "still alive" if they haven't lost in any completed game. Potential = earned points + unearned points from non-final games where the picked team hasn't been eliminated.

## Open Questions

- None

## Changes Made

- `lib/db/bracket-entry-schema.ts`: Added `totalPoints` and `potentialPoints` integer columns (default 0) to `bracketEntry` table
- `lib/scoring.ts`: Added `PoolScoring` interface, `getPointsForRound()` helper, and `calculateBracketScores()` function that computes totalPoints and potentialPoints from games, picks, and pool scoring settings. Potential points only count games where the picked team hasn't been eliminated.
- `lib/db/queries/standings.ts`: New file — `syncStandingsForTournament()` recalculates and persists scores for all bracket entries in the active tournament
- `app/(app)/admin/tournaments/[id]/games/actions.ts`: Added `syncStandingsAction()` server action for admin-triggered standings sync
- `app/(app)/admin/tournaments/[id]/games/sync-standings-button.tsx`: New client component — "Sync Standings" button with loading spinner
- `app/(app)/admin/tournaments/[id]/games/page.tsx`: Added SyncStandingsButton to admin games page header
- `components/bracket/types.ts`: Added `team1Score` and `team2Score` to `BracketGame` interface
- `components/bracket/matchup-card.tsx`: Added correct/incorrect pick indicators (green/red backgrounds), points badge on correct picks. New props: `winnerTeamId`, `gameStatus`, `roundPoints`
- `components/bracket/bracket-full-view.tsx`: Threaded `roundPointsMap` through to all MatchupCard instances, passing game result data for scoring display
- `components/bracket/bracket-editor.tsx`: Added `poolScoring` prop, computes live scores via `calculateBracketScores()`, displays "Points: X | Potential: Y" in header bar, passes `roundPointsMap` to BracketFullView
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Passes pool scoring settings to BracketEditor
- `app/globals.css`: Added `--success`, `--success-foreground`, `--failure`, `--failure-foreground` CSS variables for light and dark themes
- `docs/technical/standards.md`: Added rule requiring CSS variables for new semantic colors
- `app/(app)/pools/[id]/invites/actions.ts`: Added `hasTournamentStarted()` check to `createInviteAction`
- `app/(app)/pools/[id]/page.tsx`: Hide create bracket button and invite section after tournament starts; added chevron icon to bracket list items
