# Task: "What I Need" Rooting Guide

**Story:** #56 from backlog.md
**Status:** done
**Branch:** feature/what-i-need-and-bracket-copy

## Plan

- [x] Create core algorithm in `lib/what-i-need.ts`
- [x] Write unit tests in `lib/what-i-need.test.ts`
- [x] Create client component `components/pool/what-i-need-card.tsx`
- [x] Wire up data fetching and rendering in pool detail page

## Decisions

### Section placement on pool detail page

**Context:** Where to put the "What I Need" section
**Decision:** Between Standings and My Brackets cards on the pool detail page
**Alternatives considered:** Separate tab, bracket view page — pool detail is more natural since user is already there

### Client-side bracket switching

**Context:** Users with multiple brackets need to switch between them
**Decision:** Pass all submitted brackets' picks to the client and use `useState` + `useMemo` to recompute on switch — no server round-trip needed
**Alternatives considered:** Server action per switch — unnecessary overhead for small data (max ~63 picks x 10 brackets)

### Impact calculation

**Context:** How to define "impact" for sorting
**Decision:** Cumulative potential points through the team's remaining path (not just single game points)
**Alternatives considered:** Single-game points only — less informative about overall importance

## Changes Made

- `lib/what-i-need.ts`: Pure algorithm function `computeWhatINeed` — builds eliminated set, computes per-team cumulative impact, classifies root-for status, groups by round and sorts by impact
- `lib/what-i-need.test.ts`: 10 unit tests covering single pick, both/none, eliminated teams, cumulative impact, round grouping/sorting, in-progress games, TBD exclusion, completed exclusion, empty input
- `components/pool/what-i-need-card.tsx`: Client component with bracket selector dropdown, desktop horizontal rows and mobile stacked cards, team logos, impact badges, "Picked to X" labels, "Eliminated" badges, "No stake" and "Live" indicators
- `app/(app)/pools/[id]/page.tsx`: Added data fetching (tournament games, teams, picks for submitted brackets) and renders WhatINeedCard between Standings and My Brackets, gated on tournament started + submitted entries exist

## Verification

- Self-code review: done (3 minor issues found and fixed — eliminated team indicator, status type cast, unused potentialPoints field)
- Format: pass
- Lint: pass (pre-existing issues only: `team-logo.tsx` setState-in-effect, `scoring.test.ts` unused var)
- Build: pass
- Knip: pass (pre-existing issue only: `RoundPointsSummary` unused type)
- Test: pass (51/51)
- Acceptance criteria: all met
