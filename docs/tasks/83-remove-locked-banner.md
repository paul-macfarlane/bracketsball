# Task: Remove "Brackets are locked" banner after tournament starts

**Story:** UI improvement (not a backlog story)
**Status:** done
**Branch:** feat/tiebreaker-inline-championship (existing branch)

## Plan

- [x] Update `CountdownTimer` to return `null` when the lock time has passed (instead of showing the locked banner)
- [x] Remove the fallback locked banner from `BracketEditor` (lines 315-318)
- [x] Remove the unused `Lock` import from `CountdownTimer`
- [x] Verify build passes

## Decisions

### Remove locked banner entirely vs. show briefly after expiry

**Context:** When the countdown timer expires, it currently transitions to a "Brackets are locked" banner. We discussed showing it briefly then hiding, or just not showing it at all.
**Decision:** Return `null` once locked — the disabled UI already communicates the locked state. Simpler approach.
**Alternatives considered:** Showing the banner for ~30 seconds after expiry then hiding. Adds complexity for minimal value since users who watch the countdown tick to zero already understand brackets are locked.

## Changes Made

- `components/countdown-timer.tsx`: Return `null` instead of locked banner when timer expires. Removed unused `Lock` import.
- `components/bracket/bracket-editor.tsx`: Removed fallback "The tournament has started. Bracket editing is locked." banner.
