# Task: Create Bracket Entry

**Story:** #9 from backlog.md
**Status:** ready-for-review
**Branch:** feature/create-bracket-entry

## Plan

- [x] Schema — `bracket_entry` + `bracket_pick` tables in `bracket-entry-schema.ts`
- [x] DB Migration — Push new schema
- [x] Validators — Zod schemas for create entry, save pick, update tiebreaker, submit
- [x] Query functions — CRUD for entries + picks, count per user/pool, delete
- [x] Permissions — Pool member check, max bracket limit, tournament not started (enforced in server actions)
- [x] Server actions — Create entry, save pick, update tiebreaker, submit bracket, delete bracket
- [x] UI: Create entry — Dialog from pool detail page with name input
- [x] UI: Matchup card — Shared component for a single game pick
- [x] UI: Full bracket view — Flexbox columns with First Four support
- [x] UI: First Four — Shown as a column before R64 in regions that have play-in games
- [x] UI: Tiebreaker + submit — Input field + submit button with validation
- [x] UI: Delete bracket — Confirmation dialog on bracket editor page
- [x] Fill TODOs — `getMaxBracketCountInPool`, delete picks on member removal
- [x] Verification — Format, lint, build checks

## Decisions

### Custom bracket UI over third-party library

**Context:** Needed interactive bracket picker for 64-team tournament
**Decision:** Build custom using CSS Flexbox + Tailwind + ShadCN primitives
**Alternatives considered:** @g-loot/react-tournament-brackets (display-only, stale, React 19 risk), @karstenn/brackets (low adoption, unmaintained), Bracketry (vanilla JS, display-only)

### Full bracket view only (region view removed)

**Context:** Initially built both full bracket and region-by-region tabbed views. After user testing, full bracket view works fine on mobile with horizontal scroll.
**Decision:** Removed region view to simplify. Full bracket view is the only view mode.
**Alternatives considered:** Keeping both views — unnecessary complexity

### First Four as separate picks (not auto-assigned)

**Context:** Some bracket apps auto-assign both First Four teams to the R64 slot. User prefers forcing users to pick a winner.
**Decision:** First Four games are separate pickable matchups. The winner feeds into the R64 game as the source. Worth 0 points per scoring rules.
**Alternatives considered:** Auto-assign (skipping First Four picks) — user explicitly wanted picks

### Permissions in server actions vs separate file

**Context:** Bracket entry permissions (pool member check, max limit, tournament not started) are simpler than pool permissions
**Decision:** Enforced directly in server actions rather than a separate permissions file, since the checks are specific to each action
**Alternatives considered:** Separate `lib/permissions/bracket-entries.ts` — not warranted given the simplicity

## Doc Updates

- `docs/business/backlog.md`: Added story #15 "Live Bracket Scoring & Standings" (MVP) and renumbered subsequent non-MVP stories (16-21)
- `docs/technical/ways-of-working.md`: Added mandatory self-code review section (section 3)

## Open Questions

- None

## Changes Made

- `lib/db/bracket-entry-schema.ts`: New schema file with `bracketEntry` and `bracketPick` tables, status enum, and Drizzle relations
- `lib/db/schema.ts`: Added exports for bracket entry schema
- `lib/db/migrations/0005_wandering_the_order.sql`: Migration for new tables
- `lib/validators/bracket-entry.ts`: Zod schemas for create entry, save pick, update tiebreaker, submit
- `lib/db/queries/bracket-entries.ts`: Full CRUD — create, get by id, get by pool+user, count, save pick, delete picks, update tiebreaker, submit/unsubmit, delete entry, delete for member
- `lib/db/queries/pools.ts`: Implemented `getMaxBracketCountInPool` using bracket entries query
- `lib/db/queries/pool-members.ts`: Updated `removePoolMember` and `leavePool` to delete bracket entries when member is removed/leaves
- `app/(app)/pools/[id]/brackets/actions.ts`: Server actions — createBracketEntryAction, savePickAction, updateTiebreakerAction, submitBracketAction, deleteBracketEntryAction with downstream pick cascade invalidation
- `app/(app)/pools/[id]/brackets/create-bracket-dialog.tsx`: Client dialog for naming and creating a bracket entry
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Server component page for bracket editor
- `app/(app)/pools/[id]/page.tsx`: Added "My Brackets" section with create button and bracket list
- `components/bracket/types.ts`: Shared types, round/region labels
- `components/bracket/matchup-card.tsx`: Interactive matchup card with team slots, seed display, logo, and click-to-pick
- `components/bracket/use-bracket-picks.ts`: Client hook managing optimistic pick state, downstream cascade invalidation, and auto-save
- `components/bracket/bracket-full-view.tsx`: Full bracket view with First Four column, left/right regions flowing to center Final Four/Championship
- `components/bracket/bracket-editor.tsx`: Main editor with bracket view, tiebreaker input, submit, and delete with confirmation dialog
- `components/ui/tabs.tsx`: Added ShadCN tabs component

## Verification

- Format: run
- Lint: pass (0 errors, 0 warnings)
- Build: pass
- Acceptance criteria: all met (see below)

### Acceptance Criteria Check

- [x] User can create a new bracket entry if they haven't hit the pool's max bracket limit
- [x] Bracket entry has a user-defined name
- [x] UI presents the full tournament bracket for picking game winners (including First Four)
- [x] Each pick auto-saves so progress is not lost
- [x] User must also enter a tiebreaker (predicted total score of the championship game)
- [x] Only brackets with all games picked and a tiebreaker entered can be submitted
- [x] Incomplete brackets are clearly indicated as drafts
- [x] User can delete bracket entry before tournament starts (added per feedback)
- [x] First Four games are pickable (added per feedback)
