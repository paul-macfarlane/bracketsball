# Task: Allow Picking Known Team During First Four In-Progress

**Story:** #70 — Allow Picking Known R64 Team During First Four
**Status:** done
**Branch:** fix/first-four-partial-pick

## Plan

- [x] Investigate how `canPick` logic in `matchup-card.tsx` blocks picking when one team is TBD
- [x] Change `canPick` from per-game to per-team so each TeamSlot is independently clickable
- [x] Verify server-side validation already accepts picks for scheduled R64 games (it does)

## Changes Made

- `components/bracket/matchup-card.tsx`: Changed single `canPick` boolean (which required both teams to exist) into per-team booleans `canPickTeam1` and `canPickTeam2`. Each team slot is now independently clickable as long as that team exists and the game hasn't started.
