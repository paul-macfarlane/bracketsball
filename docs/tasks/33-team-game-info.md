# Task: Team & Game Info in Bracket Builder

**Story:** #33 from backlog.md
**Status:** ready-for-review
**Branch:** feature/team-game-info

## Plan

- [x] Research ESPN API data availability (team stats, records, rankings)
- [x] Add team stats columns to `tournament_team` table schema
- [x] Run DB migration
- [x] Create ESPN team stats fetcher (new adapter method)
- [x] Add team stats sync function + admin action/button
- [x] Update test-espn-sync script to include team stats sync
- [x] Update `getTournamentTeams` query to include new stats fields
- [x] Update `BracketTeam` type with stats fields
- [x] Build team comparison UI (info button on matchup card → dialog)
- [x] Pass game date/time and venue through to comparison dialog
- [ ] Admin UI for manual stats override (future — can use DB directly for now)

## Decisions

### Stats stored on tournament_team (not team table)

**Context:** Stats are season-specific. The same team may have different stats each year.
**Decision:** Add stats columns to `tournament_team` since it's the junction of team + tournament (season).
**Alternatives considered:** Separate `team_stats` table (more normalized but overkill), columns on `team` table (wouldn't support multi-year).

### ESPN team API as primary data source

**Context:** Need automated stats collection.
**Decision:** Use ESPN `/teams/{espnId}` for records/conference and `/teams/{espnId}/statistics` for offensive/defensive stats. Sync as a separate step from game sync (team stats don't change per-game).
**Alternatives considered:** KenPom (paid), NCAA API (unreliable), manual-only entry.

### Stats fields chosen for comparison

**Context:** User wants data to compare teams for informed picks.
**Decision:** Store: overall record, conference record, conference name, PPG, opponent PPG, FG%, 3PT%, FT%, rebounds/game, assists/game, steals/game, blocks/game, turnovers/game, AP ranking, strength of schedule (manual). These cover the "pie in the sky" request.
**Alternatives considered:** NET ranking (not available from free ESPN API — can add manually).

### Team comparison as dialog (not popover)

**Context:** Lots of stats to show, popover would be too cramped especially on mobile.
**Decision:** Use Dialog component with a "Compare" button below each matchup card. Shows team headers with logos/seeds/conference, game info (date/time/venue), and side-by-side stats with green highlighting on the better value.
**Alternatives considered:** Popover (too small), sheet/drawer (not centered).

## Changes Made

### Original task: Team stats & comparison UI

- `lib/db/tournament-schema.ts`: Added 18 stats columns to `tournament_team` (records, conference, offensive/defensive stats, AP ranking, SOS, sync timestamp)
- `lib/db/migrations/0008_busy_sersi.sql`: Migration for new columns
- `lib/espn-sync/espn-team-stats.ts`: New module — fetches team info, statistics, and AP rankings from ESPN APIs
- `lib/espn-sync/sync-team-stats.ts`: New module — syncs stats from ESPN to DB for all teams in a tournament
- `lib/db/queries/tournaments.ts`: `getTournamentTeams` now selects all stats columns
- `components/bracket/types.ts`: Added `TeamStats` interface and `stats` field to `BracketTeam`; added game info fields to `BracketGame`
- `components/bracket/team-comparison.tsx`: New component — dialog with side-by-side team stats comparison, green highlighting for better values
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Maps stats from query to BracketTeam objects
- `app/(app)/admin/tournaments/[id]/games/sync-team-stats-button.tsx`: New admin button for team stats sync
- `app/(app)/admin/tournaments/[id]/games/page.tsx`: Added Sync Team Stats button, improved mobile button layout
- `scripts/test-espn-sync.ts`: Added team stats sync step with progress logging and validation; added 2025 year config; added exit option in progressive mode
- `docs/business/backlog.md`: Added Story #37 (Team Mascot / Nickname Display), Story #38 (Admin Manual Team & Game Data Entry)

### ESPN-style bracket display & pick indicators

- `components/bracket/matchup-card.tsx`: Redesigned to ESPN-style with PickIndicator (green check/red X for correct/incorrect), view mode (grey losers, white winners, strikethrough eliminated), compare button (pre-tournament only)
- `components/bracket/bracket-full-view.tsx`: Added `getTeamById` prop, `resolvePickedTeam` helper, passes `actualTeam1Id`/`actualTeam2Id`/`pickedTeamData` to MatchupCard, game info (startTime, venue) through to all instances
- `components/bracket/bracket-viewer.tsx`: Added memoized `getTeamById`, changed `getTeamsForGame` to prioritize actual team data over picks
- `components/bracket/bracket-editor.tsx`: Passes `getTeamById` to BracketFullView
- `components/bracket/use-bracket-picks.ts`: Changed `getTeamsForGame` to prioritize actual team data, added `getTeamById` return

### ESPN sync matching fix (R32+ games matched to wrong DB records)

- `lib/espn-sync/sync.ts`: Fixed `findPositionalMatch` — R32/S16/E8 now use team seeds traced to R64 ancestry for correct matching instead of blindly picking `candidates[0]`; Final Four uses same ancestry matching; `scheduleOnly` mode no longer sets team IDs (prevents premature team placement during progressive testing)

### Misc

- `app/globals.css`: Added `--warning` semantic color variable (light/dark themes)

## Verification

- Self-code review: done — 7 issues found and fixed across 2 review passes:
  - Pass 1 (original task): 4 issues fixed (div-by-zero in team-comparison, missing transaction in sync-team-stats, loose typing, missing inline date/time)
  - Pass 2 (bracket display + sync fixes): 3 more issues fixed:
    1. Hardcoded `text-yellow-500` — added `--warning` CSS variable, use `text-warning`
    2. Dead `gamesById` variable in `bracket-full-view.tsx` — removed
    3. `getTeamsForGame` in `bracket-viewer.tsx` not memoized — wrapped in `useCallback`
  - Deferred (low priority): `Record<string, unknown>` in `sync.ts` updateData
- Format: pass
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met
  - Investigation phase documented in task Decisions section
  - Game details button (Compare) on each matchup with both teams
  - Dialog shows venue/location, records, stats, conference, AP ranking
  - Conference record conditionally shown (ESPN doesn't provide; schema supports manual entry)
  - Inline date/time on matchup cards when startTime exists
  - Data auto-synced via ESPN with admin override capability
  - 18 new columns on tournament_team stored and synced
  - ESPN-style bracket display with correct pick indicators
  - Sync correctly matches R32+ ESPN games to DB records via seed ancestry
