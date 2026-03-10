# Task: Fix Bracket Submit Double-Click

**Story:** #26 from backlog.md
**Status:** ready-for-review
**Branch:** fix/bracket-submit-double-click

## Plan

- [x] Investigate root cause
- [x] Fix: separate useTransition for submit so tiebreaker blur doesn't disable the button
- [x] Fix: save tiebreaker within handleSubmit to eliminate race condition
- [x] Verify build passes
- [x] Run /pre-review

## Root Cause

When user types a tiebreaker and clicks Submit:

1. Tiebreaker input blur fires → `handleTiebreakerBlur()` → shared `startTransition` sets `isPending = true`
2. Submit button is `disabled={... || isPending}` → disabled before click event fires
3. Race condition: even if click fires, `submitBracketAction` reads tiebreaker from DB which may not be saved yet

## Changes Made

- `components/bracket/bracket-editor.tsx`: Separate useTransition for submit; save tiebreaker in submit flow

## Decisions

### Separate submit transition + inline tiebreaker save

**Context:** Submit and tiebreaker blur share one `useTransition`, causing the submit button to be disabled during tiebreaker saves
**Decision:** Use a dedicated `isSubmitting` transition for submit, and save the tiebreaker as part of the submit flow before calling submitBracketAction
**Alternatives considered:** Could modify submitBracketAction to accept tiebreaker param, but that's more invasive; separate transitions alone solve the UX issue, and saving tiebreaker in handleSubmit solves the race

## Verification

- Self-code review: done (no issues)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
  - Clicking submit once successfully submits the bracket and shows a success indicator: YES
  - Investigate and fix the root cause of requiring two clicks: YES (shared useTransition + race condition)
  - Submit button shows loading/disabled state while submission is in progress: YES (isSubmitting state)
