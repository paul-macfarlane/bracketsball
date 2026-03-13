# Task: Public Pools (#18 + #20)

**Story:** #18 Bracket Pool Public/Private Toggle + #20 Public Pool Search from backlog.md
**Status:** ready-for-review
**Branch:** feature/18-20-public-pools

## Plan

- [x] Step 1: Database — Add `visibility` column to `pool` table
- [x] Step 2: Validators — Add `visibility` to create & update schemas
- [x] Step 3: Queries — Update pool CRUD + add public pool search query
- [x] Step 4: Create Pool Form — Add visibility select
- [x] Step 5: Pool Settings Form — Add visibility select
- [x] Step 6: Navigation — Add "Discover" link
- [x] Step 7: Discover Page — Public pool search & browse
- [x] Step 8: My Pools Page — Add discover link
- [x] Step 9: Backlog & task updates

## Open Questions

- None

## Changes Made

- `lib/db/pool-schema.ts`: Added `poolVisibilityEnum` and `visibility` column (default "private")
- `lib/db/schema.ts`: Exported `poolVisibilityEnum`
- `lib/db/migrations/0010_overconfident_wilson_fisk.sql`: Generated migration for visibility enum + column
- `lib/validators/pool.ts`: Added `POOL_VISIBILITY_OPTIONS`, `PoolVisibility` type, `visibility` field to create and update schemas
- `lib/db/queries/pools.ts`: Added `visibility` to `CreatePoolData`/`UpdatePoolData`, added `getPublicPools()` (with `userId` for membership check), `getPublicPoolById()`, `joinPublicPool()` queries
- `app/(app)/pools/create/create-pool-form.tsx`: Added visibility Select field (defaults to Private)
- `app/(app)/pools/create/actions.ts`: Added `hasTournamentStarted()` guard
- `app/(app)/pools/create/page.tsx`: Added tournament-started locked UI
- `app/(app)/pools/[id]/settings/pool-settings-form.tsx`: Added visibility Select field with description
- `app/(app)/pools/[id]/settings/page.tsx`: Added `visibility` to defaultValues
- `app/(app)/app-header.tsx`: No changes (Discover is not a nav item, accessed via Pools page)
- `app/(app)/pools/page.tsx`: Added "Discover Pools" button in header and empty state
- `app/(app)/pools/discover/page.tsx`: **NEW** — Server component fetching initial public pools + tournament status
- `app/(app)/pools/discover/discover-pools-client.tsx`: **NEW** — Client component with search, filters, sort, pagination, join w/ confirmation dialog, tournament-locked banner, "Already Joined" indicator
- `app/(app)/pools/discover/actions.ts`: **NEW** — Server actions for search and join with Zod validation
- `app/(app)/invite/[code]/actions.ts`: Added `hasTournamentStarted()` guard
- `app/(app)/invite/[code]/page.tsx`: Added tournament-started error card
- `docs/technical/standards.md`: Added migration file requirement for schema changes
- `docs/business/backlog.md`: Marked #18 and #20 as Done

## Decisions

### Lock pool creation, joining, and settings after tournament starts

**Context:** Needed consistent behavior for what's allowed once games begin. Previously, pool settings were locked but pool creation and invite-based joining were not.
**Decision:** All three are locked once any game in the active tournament has a non-scheduled status. This applies to: creating pools, joining via public search, joining via invite link, and editing pool settings.
**Alternatives considered:** Allow joining during First Four (since First Four scoring defaults to 0 and isn't pickable). Rejected for simplicity — "any game started = locked" is the most predictable cutoff and matches industry standard (ESPN, Yahoo, CBS all lock at first tip-off).

## Doc Updates

- `docs/technical/standards.md`: Added standard for generating migration files before pushing schema changes

## Verification

### Pre-review #1

- Self-code review: done (5 issues found and fixed)
  - Added Zod validation to `searchPublicPools` server action (standards require input validation at boundaries)
  - Fixed nav link active state overlap (`/pools` was highlighting on `/pools/discover`)
  - Deduplicated search logic in `discover-pools-client.tsx` (`handleSortChange` now calls `doSearch`)
  - Escaped LIKE wildcards (`%`, `_`) in search string to prevent unexpected results
  - Moved `memberCountSubquery` inside `getPublicPools` function scope for safety

### Pre-review #2 (after tournament-lock changes)

- Self-code review: done (3 issues found and fixed)
  - Added Zod validation to `joinPublicPoolAction` for `poolId` param (standards compliance)
  - Simplified `or(ne(...))` to `ne(...)` in `hasTournamentStarted()` and `joinPublicPool()` (code clarity)
  - Removed unused `or` import from `pools.ts`
- Format: run
- Lint: pass (0 errors, 0 warnings)
- Build: pass (0 TypeScript errors)
- Tests: pass (22/22)
- Acceptance criteria: all met
  - #18: visibility toggle at creation + settings, public/private enum, private default
  - #20: name search, brackets/participants filters, capacity filtering, join from results with confirmation
  - Tournament lock: pool creation, invite join, public join, and settings edit all blocked after tournament starts (action + UI level)
