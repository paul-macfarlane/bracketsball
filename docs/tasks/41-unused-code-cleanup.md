# Task: Unused Code Enforcement & Cleanup

**Story:** #41 from backlog.md
**Status:** ready-for-review
**Branch:** feature/tech-debt-cleanup

## Plan

- [x] Install and configure knip for unused code detection
- [x] Run initial knip audit across the codebase
- [x] Remove confirmed unused exports and dead code
- [x] Integrate knip into lint pipeline (`pnpm knip` script)
- [x] Document tool and configuration in standards.md
- [x] Verify removal doesn't break build or tests

## Changes Made

- `package.json`: Added `knip` dev dependency and `pnpm knip` script
- `knip.config.ts`: New config file — entry points for Next.js App Router conventions, ignores ShadCN UI components, ignores `postcss` transitive dependency
- `docs/technical/standards.md`: Added knip documentation to Linting & Formatting section; added "No speculative exports" standard to Database section

### Unused file deleted

- `lib/env.ts`: Environment validation module that was never imported anywhere

### Unused functions removed (7)

- `deleteBracketEntriesForMember` from `lib/db/queries/bracket-entries.ts`
- `getPoolMemberCount` from `lib/db/queries/pool-members.ts` (duplicate of same function in pools.ts)
- `createTournamentGame`, `updateTournamentGame`, `deleteTournamentGame` from `lib/db/queries/tournaments.ts`
- `getUserById` from `lib/db/queries/users.ts`
- `REGION_LABELS` constant from `components/bracket/types.ts`

### Exports removed (made file-private) (3 functions, 1 enum)

- `fetchESPNScoreboard` in `lib/espn-sync/espn-adapter.ts` (used internally only)
- `fetchTeamStats` in `lib/espn-sync/espn-team-stats.ts` (used internally only)
- `poolMemberRoleEnum` in `lib/db/pool-schema.ts` (used internally for column definitions)

### Unused type exports removed (8 unexported, 4 deleted)

- Unexported: `StandingsEntry`, `ESPNVenue`, `ESPNCompetitor`, `ESPNTeam`, `ESPNNote`, `TeamStatsSyncResult`, `PoolAction`, `PoolPage`
- Deleted: `SendPoolUserInviteFormValues`, `SearchUsersFormValues`, `UpdateGameFormValues`, `BracketPositionsFormValues`
- Unexported (made file-private): `sendPoolUserInviteSchema`, `searchUsersSchema` in `lib/validators/pool-user-invite.ts`

## Verification

- Self-code review: done (no issues)
- Format: clean
- Lint: pass
- Build: pass
- Knip: pass
- Tests: pass (22/22)
- Acceptance criteria: all met
