# Task: Auto-Fill Algorithm Audit & Fixes

**Status:** done
**Branch:** fix/auto-fill-algorithm-audit

## Plan

- [x] Fix equal-seed coin flip in stats fallback path
- [x] Improve normalization to use global stat ranges across all tournament teams
- [x] Prevent all-zero weights in the UI (disable Generate button + warning)

## Decisions

### Global stat ranges instead of pairwise normalization

**Context:** 2-team min-max normalization collapses each stat to binary 0/1, losing margin information. This makes the chaos closeness metric unreliable — a barely-better-everywhere team appears to dominate by max score.
**Decision:** Compute stat ranges across all tournament teams once upfront and pass into per-matchup scoring. This preserves actual magnitude differences.
**Alternatives considered:** Using percentile ranks, z-scores. Global min-max is simplest and sufficient.

## Changes Made

- `lib/bracket-auto-fill.ts`: Added `computeGlobalStatRanges`, threaded global ranges through `autoFillBracket` → `pickWinnerByStats` → `computeTeamScore`. Fixed equal-seed coin flip.
- `components/bracket/stats-auto-fill-dialog.tsx`: Added all-zero weight validation with disabled button + helper text.
