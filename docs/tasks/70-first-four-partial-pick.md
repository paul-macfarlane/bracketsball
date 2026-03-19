# Task: Allow Picking Known Team During First Four In-Progress

**Story:** #70 — Allow Picking Known R64 Team During First Four
**Status:** done
**Branch:** fix/first-four-partial-pick

## Plan

- [x] Investigate how `canPick` logic in `matchup-card.tsx` blocks picking when one team is TBD
- [x] Change `canPick` from per-game to per-team so each TeamSlot is independently clickable
- [x] Verify server-side validation already accepts picks for scheduled R64 games (it does)
- [x] Fix auto-fill to pick the sole available team when only one team is known
- [x] Fix submission blocking caused by auto-fill skipping partially-available games

## Changes Made

- `components/bracket/matchup-card.tsx`: Changed single `canPick` boolean (which required both teams to exist) into per-team booleans `canPickTeam1` and `canPickTeam2`. Each team slot is now independently clickable as long as that team exists and the game hasn't started.
- `lib/bracket-auto-fill.ts`: Changed `autoFillBracket` to auto-pick the sole available team when only one team is known (e.g. R64 game where the other team comes from an in-progress First Four). Previously skipped these games entirely, which left them unpicked and blocked bracket submission.
