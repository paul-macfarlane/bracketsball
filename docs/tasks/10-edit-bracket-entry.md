# Task: Edit Bracket Entry

**Story:** #10 from backlog.md
**Status:** ready-for-review
**Branch:** feature/edit-bracket-entry

## Plan

- [x] Check tournament start status on bracket editor page and pass to BracketEditor
- [x] Disable bracket editor UI (picks, tiebreaker, submit, delete) when tournament has started
- [x] Show user-friendly locked banner explaining why editing is disabled
- [x] Add "Edit Picks" button to unsubmit a submitted bracket (before tournament starts)
- [x] Add unsubmitBracketAction server action with auth + tournament start checks
- [x] Add editable bracket name (inline input, saves on blur, works even after tournament starts)
- [x] Verify all acceptance criteria are met
- [x] Run /pre-review

## Decisions

### Most edit functionality already existed from Story 9

**Context:** Story 9 (Create Bracket Entry) built the bracket editor with auto-save, pick modification, tiebreaker updates, and downstream cascade invalidation. The same page serves both create and edit flows.
**Decision:** Story 10 only needed to add: (1) proactive tournament-start locking on the UI, (2) an explicit unsubmit flow so users can edit submitted brackets before tournament starts, and (3) hiding destructive actions (delete) when locked.
**Alternatives considered:** Building a separate edit page — unnecessary since the existing editor page already loads and edits existing picks.

### Bracket name editable at any time

**Context:** User requested that bracket names be editable even after the tournament starts, since the name is cosmetic and doesn't affect scoring.
**Decision:** Name editing is always available (not gated by tournament start). Uses an inline input that saves on blur, matching the tiebreaker save pattern.

## Open Questions

- None

## Changes Made

- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Added `hasTournamentStarted()` query and pass `tournamentStarted` prop to BracketEditor
- `app/(app)/pools/[id]/brackets/actions.ts`: Added `unsubmitBracketAction` and `updateBracketNameAction` server actions with Zod validation, auth, and ownership checks. Name update has no tournament-start gate per requirements.
- `components/bracket/bracket-editor.tsx`: Added `tournamentStarted` prop, locked banner when tournament has started, "Edit Picks" unsubmit button for submitted brackets (pre-tournament), hide delete/submit buttons when locked, use combined `isDisabled` flag for picks/tiebreaker, inline editable bracket name input
- `lib/db/queries/bracket-entries.ts`: Added `updateBracketEntryName` query function
- `lib/validators/bracket-entry.ts`: Added `updateBracketNameSchema` Zod schema

## Verification

- Self-code review: done (1 issue found — missing Zod validation in unsubmitBracketAction — fixed)
- Format: run
- Lint: pass (0 errors, 0 warnings)
- Build: pass
- Acceptance criteria: all met (see below)

### Acceptance Criteria Check

- [x] All picks and tiebreaker can be modified before tournament games begin — picks auto-save via `savePickAction`, tiebreaker auto-saves via `updateTiebreakerAction`, submitted brackets can be unsubmitted via "Edit Picks" button
- [x] Same auto-save behavior as creation — uses identical `useBracketPicks` hook and server actions
- [x] Editing is locked once the tournament starts — server-side: all mutation actions check `hasTournamentStarted()`; client-side: `isLocked` disables picks/tiebreaker, hides submit/delete/unsubmit buttons, shows locked banner
- [x] Bracket name can be edited at any time (including after tournament starts) — inline input saves on blur via `updateBracketNameAction`
