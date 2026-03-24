# Task: Move tiebreaker display inline under championship game when tournament is active

**Story:** Ad-hoc UX improvement (not from backlog)
**Status:** done
**Branch:** feat/tiebreaker-inline-championship

## Plan

- [x] Modify `BracketFullView` to accept optional tiebreaker props and render inline under championship game
- [x] Modify `BracketEditor` to conditionally hide sticky bottom bar when locked, pass tiebreaker to `BracketFullView`
- [x] Run pre-review checks

## Decisions

### Conditional rendering based on lock state

**Context:** Tiebreaker sticky bar is useful during pick-making but obstructive during tournament viewing
**Decision:** Keep sticky bar for unlocked state (active editing), show read-only inline display for locked state
**Alternatives considered:** Always inline (loses the sticky CTA for submitting), always in header (less contextual)

## Changes Made

- `components/bracket/bracket-full-view.tsx`: Accept optional `tiebreakerScore` prop, render below championship matchup card
- `components/bracket/bracket-editor.tsx`: Hide sticky bottom bar when locked, pass tiebreaker to BracketFullView
- `components/bracket/bracket-viewer.tsx`: Accept optional `tiebreakerScore` prop, pass through to BracketFullView
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Pass `tiebreakerScore` to BracketViewer

## Verification

- Self-code review: done (no issues)
- Format: run
- Lint: pass (1 pre-existing error + 1 pre-existing warning, unrelated to changes)
- Build: pass
- Knip: pass (1 pre-existing unused export, unrelated to changes)
- Tests: pass (69/69)
- Acceptance criteria: ad-hoc improvement, no backlog story — verified behavior matches intent
