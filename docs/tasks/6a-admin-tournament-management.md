# Task: Admin Tournament Management UI + Seed Scripts

**Story:** #6a (new sub-story under Sports Data epic)
**Status:** ready-for-review
**Branch:** feature/admin-tournament-management

## Plan

### Phase 1: Schema & Auth Changes

- [x] Add `appRole` pgEnum ("user", "admin") and column to `user` table in auth-schema.ts
- [x] Register `appRole` as an additionalField in Better Auth config
- [x] Create `team` table (id, name, shortName, abbreviation, logoUrl, espnId, createdAt, updatedAt)
- [x] Create `tournament` table (id, name, year, isActive, createdAt, updatedAt)
- [x] Create `tournamentRoundEnum` pgEnum (first_four, round_of_64, round_of_32, sweet_16, elite_8, final_four, championship)
- [x] Create `tournamentRegionEnum` pgEnum (south, east, west, midwest)
- [x] Create `gameStatusEnum` pgEnum (scheduled, in_progress, final)
- [x] Create `tournament_team` table (id, tournamentId, teamId, seed, region)
- [x] Create `tournament_game` table (id, tournamentId, round, region, gameNumber, team1Id, team2Id, team1Score, team2Score, winnerTeamId, status, startTime, venueName, venueCity, venueState, espnEventId, sourceGame1Id, sourceGame2Id, createdAt, updatedAt)
- [x] Add relations for all new tables
- [x] Export from schema.ts

### Phase 2: Admin Auth Guard

- [x] Create `app/(app)/admin/layout.tsx` that checks session user's appRole and redirects non-admins
- [x] Admin auth check via `requireAdmin()` helper in server actions

### Phase 3: Admin Teams CRUD

- [x] Create `lib/db/queries/teams.ts` (getAll, getById, create, update, delete)
- [x] Create `lib/validators/team.ts` (Zod schema for team form)
- [x] Create `app/(app)/admin/page.tsx` (admin dashboard with links)
- [x] Create `app/(app)/admin/teams/page.tsx` (list teams with search)
- [x] Create `app/(app)/admin/teams/new/page.tsx` (create team form)
- [x] Create `app/(app)/admin/teams/[id]/edit/page.tsx` (edit team form)
- [x] Create server actions for team CRUD in `app/(app)/admin/teams/actions.ts`
- [x] Delete team with confirmation dialog

### Phase 4: Admin Tournament Management

- [x] Create `lib/db/queries/tournaments.ts` (CRUD + getActive, setActive, tournament teams, tournament games)
- [x] Create `lib/validators/tournament.ts` (Zod schemas + display name maps)
- [x] Create `app/(app)/admin/tournaments/page.tsx` (list tournaments)
- [x] Create `app/(app)/admin/tournaments/new/page.tsx` (create tournament)
- [x] Create `app/(app)/admin/tournaments/[id]/page.tsx` (tournament detail/dashboard)
- [x] Create server actions for tournament CRUD + toggle active + delete

### Phase 5: Admin Tournament Teams

- [x] Tournament teams queries integrated into `lib/db/queries/tournaments.ts`
- [x] Create `app/(app)/admin/tournaments/[id]/teams/page.tsx` (assign teams with seed + region, grouped by region)
- [x] Add team form with team selector, region dropdown, seed input
- [x] Remove team button

### Phase 6: Admin Tournament Games

- [x] Tournament games queries integrated into `lib/db/queries/tournaments.ts`
- [x] Create `app/(app)/admin/tournaments/[id]/games/page.tsx` (manage games by round)
- [x] Inline game editing (scores, status, winner selection)
- [x] Generate bracket action — creates all 67 games (R64 through Championship) with proper seeding and bracket tree
- [x] Auto-advance winners to next round when a game is marked final

### Phase 7: Seed Scripts

- [x] Create `scripts/seed-teams.ts` — 68 real teams from 2025 NCAA tournament (sourced from ESPN API)
- [x] Create `scripts/seed-tournament.ts` — creates tournament, assigns all 68 teams, creates First Four + full bracket (67 games)
- [x] Add `db:seed:teams` and `db:seed:tournament` scripts to package.json
- [x] Added `tsx` dev dependency for running scripts

## Changes Made

- `lib/db/auth-schema.ts`: Added `appRoleEnum` and `appRole` column to user table
- `lib/auth/index.ts`: Registered `appRole` as Better Auth additionalField
- `lib/db/tournament-schema.ts`: New file — team, tournament, tournamentTeam, tournamentGame tables + enums + relations
- `lib/db/schema.ts`: Export all new tables, enums, and relations
- `lib/db/queries/teams.ts`: New file — team CRUD queries
- `lib/db/queries/tournaments.ts`: New file — tournament, tournament team, and tournament game queries
- `lib/validators/team.ts`: New file — Zod schema for team form
- `lib/validators/tournament.ts`: New file — Zod schemas + display name constants
- `app/(app)/admin/layout.tsx`: Admin auth guard layout
- `app/(app)/admin/page.tsx`: Admin dashboard
- `app/(app)/admin/teams/`: Teams list, create, edit, delete pages + actions
- `app/(app)/admin/tournaments/`: Tournaments list, create, detail pages + actions
- `app/(app)/admin/tournaments/[id]/teams/`: Team assignment UI
- `app/(app)/admin/tournaments/[id]/games/`: Games management + bracket generation
- `scripts/seed-teams.ts`: 68 real 2025 NCAA tournament teams
- `scripts/seed-tournament.ts`: Full tournament seeding with First Four + bracket
- `package.json`: Added tsx dependency and seed scripts
- `components/ui/table.tsx`: Added via ShadCN CLI
- `docs/business/backlog.md`: Split story #6 into 6a (Admin) and 6b (ESPN Sync)
- `docs/technical/sports-data-source-research.md`: New research doc

## Verification

- Format: run
- Lint: pass (zero errors/warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met

## Decisions

### appRole on user table vs. separate table

**Context:** Need to distinguish admin users from regular users
**Decision:** Add `appRole` column directly to the `user` table with a pgEnum
**Alternatives considered:** Separate `user_role` table — overkill for a simple two-value role that every user has exactly one of

### Tournament game bracket tree structure

**Context:** Need to represent how games feed into each other across rounds
**Decision:** Use `sourceGame1Id` and `sourceGame2Id` self-references on `tournament_game` to encode the bracket tree. Null for R64/First Four games (where teams are known upfront).
**Alternatives considered:** Implicit bracket tree from seed math — simpler but fragile and can't handle play-in games or reseeding

### Team references on tournament_game

**Context:** Games in later rounds don't have teams assigned until earlier games complete
**Decision:** `team1Id` and `team2Id` are nullable foreign keys to `team`. Null means "TBD — determined by source game winner."
**Alternatives considered:** Referencing `tournament_team` instead of `team` — adds indirection without clear benefit since seed/region is already on `tournament_team`

### Tournament teams + games queries co-located

**Context:** Whether to create separate query files for tournament teams and games
**Decision:** Co-located all tournament-related queries in `lib/db/queries/tournaments.ts` since they're closely related and used together
**Alternatives considered:** Separate `tournament-teams.ts` and `tournament-games.ts` — would fragment related logic

### Seed data sourced from ESPN API

**Context:** Need accurate 2025 tournament data for seed scripts
**Decision:** Fetched real data from ESPN scoreboard API for all 68 teams including correct seeds, regions, and ESPN IDs
**Alternatives considered:** Placeholder data — less useful for UX testing
