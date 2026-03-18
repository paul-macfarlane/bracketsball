# Task: Bracket Copy / Duplicate

**Story:** #57 from backlog.md
**Status:** done
**Branch:** feature/bracket-copy-duplicate

## Plan

- [x] Add `duplicateBracketSchema` to validators
- [x] Update `createBracketEntry` query to accept `DbClient` for transaction use
- [x] Add `duplicateBracketEntryAction` server action
- [x] Create `BracketEntryRow` client component with "..." dropdown (Duplicate + Delete)
- [x] Update pool detail page to use `BracketEntryRow`
- [x] Update `BracketEditor` to replace Delete button with "..." dropdown (Duplicate + Delete)

## Decisions

### Duplicate name collision handling

**Context:** User may duplicate the same bracket multiple times
**Decision:** Append incrementing number: "(Copy)", "(Copy 2)", "(Copy 3)" etc.
**Alternatives considered:** Allow duplicate names (confusing), require user input (extra step)

### No duplicate on BracketViewer

**Context:** BracketViewer is only rendered for non-owners (owner always sees BracketEditor)
**Decision:** Only add duplicate to BracketEditor and pool detail page
**Alternatives considered:** Adding to BracketViewer, but it's unnecessary since owners never see it

### Redirect behavior

**Context:** Duplicate available in two places
**Decision:** Pool detail page: stay on page (refresh). Bracket editor: redirect to new bracket.
**Alternatives considered:** Always redirect (disorienting on pool page), never redirect (can't see new bracket from editor)

## Open Questions

None — all clarified with user.

## Changes Made

- `lib/validators/bracket-entry.ts`: Added `duplicateBracketSchema`
- `lib/db/queries/bracket-entries.ts`: Added `client: DbClient` param to `createBracketEntry` for transaction support
- `app/(app)/pools/[id]/brackets/actions.ts`: Added `duplicateBracketEntryAction` — validates auth, pool membership, tournament lock, max brackets; generates unique name with (Copy)/(Copy N) suffix; copies picks and tiebreaker in a transaction
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: New client component replacing inline bracket entry `<Link>` with navigation link + "..." dropdown (Duplicate + Delete with confirmation dialog)
- `app/(app)/pools/[id]/page.tsx`: Replaced inline bracket entry rendering with `BracketEntryRow` component; removed unused `AlertTriangle`, `ChevronRight`, `Badge` imports
- `components/bracket/bracket-editor.tsx`: Replaced standalone Delete button with "..." dropdown containing Duplicate and Delete; added `canDuplicate` prop; duplicate redirects to new bracket
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Added `getBracketEntryCountForUser` to compute `canDuplicate` and pass to `BracketEditor`
- `lib/db/queries/bracket-entries.ts`: Added `getChampionPicksForEntries` query for champion pick logos on bracket list
- `components/bracket/bracket-editor.tsx`: Fixed pre-existing amber color violations to use CSS variables (`border-warning`, `bg-warning/10`, `text-warning-foreground`)
- `app/(app)/pools/[id]/page.tsx`: Fixed amber color in warning text to use `text-warning-foreground`

## Verification

- Self-code review: done (2 issues found and fixed — amber colors in bracket-editor.tsx, name truncation edge case)
- Format: pass
- Lint: pass (pre-existing issues only: `team-logo.tsx` setState-in-effect, `scoring.test.ts` unused var)
- Build: pass
- Knip: pass (pre-existing issue only: `RoundPointsSummary` unused type)
- Test: pass (51/51)
- Acceptance criteria: all met
