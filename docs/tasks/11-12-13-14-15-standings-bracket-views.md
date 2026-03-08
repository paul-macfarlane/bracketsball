# Task: Pool Standings & Bracket Views

**Stories:** #11, #12, #13, #14, #15 from backlog.md
**Status:** ready-for-review
**Branch:** feature/pool-standings-bracket-views

## Plan

- [x] Add DB query: `getPoolStandings` — returns all entries with live-computed scores, user info, champion pick, ranks with ties
- [x] Build standings table inline on pool detail page (not a separate route)
  - [x] Table with: rank (with ties), bracket name, owner (avatar + name + username), champion pick (logo), points, potential points
  - [x] Sorted by: points desc, potential desc, tiebreaker accuracy (when championship has result), alphabetical
  - [x] Sortable by points and potential columns (client-side)
  - [x] Mobile: card-based layout with full-row tap targets and chevron affordance
  - [x] Link each entry to bracket detail view
- [x] Open bracket view to all pool members (read-only for non-owners)
  - [x] Created `BracketViewer` component reusing `BracketFullView`
  - [x] Any pool member can view any submitted bracket in their pool (read-only)
  - [x] Non-owners blocked from viewing draft brackets
  - [x] Shows header with bracket name, status badge, points, potential
  - [x] No editing controls (no tiebreaker, no submit, no delete)
- [x] Created shared `UserDisplay` component (avatar + name + username), used in standings and member list
- [x] Updated member list to use `UserDisplay` component

## Decisions

### Combined standings view for Stories 11 & 12

**Context:** Stories 11 and 12 were separate views (my brackets, other members' brackets)
**Decision:** Combine into a single pool standings table on the pool detail page, per user request
**Alternatives considered:** Separate pages, separate standings route

### Read-only bracket view route

**Context:** Need to allow any pool member to view any bracket in the pool
**Decision:** Open existing bracket page to pool members with read-only mode (no separate route)
**Alternatives considered:** Separate `/view` route — unnecessary duplication

### Tiebreaker accuracy sorting

**Context:** Standings need tiebreaker as a sort criterion
**Decision:** When championship game has a final score, sort by absolute difference between predicted and actual. When no result, tiebreaker has no effect on sort.

### Story 11 scope reduction

**Context:** Story 11 originally included a cross-pool "My Brackets" view
**Decision:** Per user request, removed cross-pool view. Pool-level standings covers the use case.

### Live score computation

**Context:** Stored `totalPoints`/`potentialPoints` on bracketEntry were 0 before admin sync ran
**Decision:** Compute scores live in `getPoolStandings` using `calculateBracketScores` with all games and picks. No longer depends on stored values being up to date.

### Tie handling in standings

**Context:** Entries with identical points, potential, and tiebreaker accuracy should show same rank
**Decision:** Assign rank based on previous entry — if all sort fields match, share the same rank number (e.g., 1, 1, 3).

## Changes Made

- `lib/db/queries/bracket-entries.ts`: Rewrote `getPoolStandings()` — computes live scores via `calculateBracketScores`, includes username, assigns ranks with tie handling
- `components/pool/standings-table.tsx`: New client-side sortable standings table with desktop (table) and mobile (card list with tap targets) layouts
- `components/user-display.tsx`: New shared component showing avatar + name + username, used in standings and member list
- `components/bracket/bracket-viewer.tsx`: Read-only bracket viewer reusing `BracketFullView`
- `app/(app)/pools/[id]/page.tsx`: Standings table inline on pool detail page, removed separate standings button, added pool scoring for live computation
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Any pool member can view brackets (owners: editor, non-owners: read-only viewer). Draft brackets blocked for non-owners.
- `app/(app)/pools/[id]/members/member-list.tsx`: Refactored to use shared `UserDisplay` component
- Deleted `app/(app)/pools/[id]/standings/` — standings now inline on pool page

## Verification

- Self-code review: done (2 issues found and fixed — draft bracket visibility, standings draft filtering)
- Format: pass
- Lint: pass (0 errors, 0 warnings)
- Build: pass (0 TypeScript errors)
- Acceptance criteria: all met for stories 11, 12, 13, 14, 15
- UX feedback round: addressed (inline standings, ties, live potential, sorting, mobile, user display component)
