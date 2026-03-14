# Task: Team Mascot / Nickname Display

**Story:** #37 from backlog.md
**Status:** done
**Branch:** feature/37-team-mascot-display

## Plan

- [x] Add `mascot` column to `team` table (DB schema + migration)
- [x] Update ESPN sync to capture mascot from `team.name` field
- [x] Update team validator, admin form, and CRUD actions
- [x] Update `getTournamentTeams` query to include `teamMascot`
- [x] Update `BracketTeam` interface and all construction sites
- [x] Display mascot in team comparison dialog
- [x] Add mascot to champion pick data in standings
- [x] Run /pre-review

## Decisions

### ESPN name field mapping

**Context:** ESPN API provides `location` (school name, e.g., "Auburn"), `name` (mascot, e.g., "Tigers"), and `displayName` (full, e.g., "Auburn Tigers").
**Decision:** Map `team.name` from ESPN to the new `mascot` column. Existing `name` field continues using `location`.
**Alternatives considered:** Renaming existing fields — rejected to avoid breaking changes.

### Compact view behavior

**Context:** AC says "On compact views (matchup cards), continue showing short name only"
**Decision:** Matchup cards unchanged (show `shortName`). Mascot shown in team comparison dialog and standings champion tooltip.
**Alternatives considered:** Showing mascot below shortName on matchup cards — too cramped at 176px width.

## Changes Made

- `lib/db/tournament-schema.ts`: Added nullable `mascot` text column to `team` table
- `lib/db/migrations/0011_first_stark_industries.sql`: Generated migration
- `lib/espn-sync/types.ts`: Added `mascot` to `SyncTeam` interface
- `lib/espn-sync/espn-adapter.ts`: Map `comp.team.name` to `mascot` field
- `lib/espn-sync/sync.ts`: Include `mascot` in upsertTeam operations
- `lib/validators/team.ts`: Added optional `mascot` field to schema
- `app/(app)/admin/teams/team-form.tsx`: Added mascot form field
- `app/(app)/admin/teams/actions.ts`: Handle mascot in create/update actions
- `app/(app)/admin/teams/[id]/edit/page.tsx`: Pass mascot default value
- `lib/db/queries/tournaments.ts`: Added `teamMascot` to `getTournamentTeams` select
- `lib/db/queries/bracket-entries.ts`: Added `teamMascot` to champion pick data
- `components/bracket/types.ts`: Added `mascot` to `BracketTeam` interface
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Map `teamMascot` to BracketTeam
- `app/(app)/pools/[id]/brackets/actions.ts`: Map `teamMascot` to BracketTeam
- `components/bracket/team-comparison.tsx`: Display mascot below team name
- `components/pool/standings-table.tsx`: Added `teamMascot` to StandingsEntry, show in champion tooltip
- `lib/db/queries/teams.ts`: Added `mascot` to `createTeam` and `updateTeam` parameter types

## Verification

- Self-code review: done (1 issue found and fixed — `lib/db/queries/teams.ts` was missing `mascot` in parameter types)
- Format: passed
- Lint: passed (zero errors, zero warnings)
- Build: passed (zero TypeScript errors)
- Acceptance criteria:
  - Add `mascot` field to `team` table: **met**
  - ESPN syncs mascot automatically via `team.name`: **met**
  - Display mascot where space allows (team comparison dialog, standings): **met**
  - Compact views (matchup cards) show short name only: **met**
  - Admin can edit mascot via team management UI: **met**
