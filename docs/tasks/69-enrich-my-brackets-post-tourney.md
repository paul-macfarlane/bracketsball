# Task: Enrich My Brackets Section Post-Tournament Start

**Story:** #69 from backlog.md
**Status:** done
**Branch:** feature/enrich-my-brackets-post-tourney

## Plan

- [x] Pass standings data to My Brackets section (placement, points, potential) from pool detail page
- [x] Update BracketEntryRow to accept and display placement, points, and potential points
- [x] Sort brackets by placement once tournament starts
- [x] Hide "Submitted" badge post-tournament
- [x] Hide draft/unsubmitted brackets post-tournament
- [x] Verify pre-tournament behavior is unchanged

## Open Questions

- None

## Changes Made

- `docs/business/backlog.md`: Added story #69 — Enrich My Brackets Section Post-Tournament Start
- `app/(app)/pools/[id]/page.tsx`: Built `myBracketStandings` map from standings data, created `displayedBracketEntries` that filters to submitted-only and sorts by rank post-tournament, passed `standingsInfo` and `totalBrackets` props to BracketEntryRow
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: Added `standingsInfo` and `totalBrackets` props, added `getOrdinal` helper, shows placement/points/potential post-tournament, hides Submitted badge post-tournament

## Verification

- Self-code review: done (no blocking issues)
- Format: run (no changes needed)
- Lint: pass (2 pre-existing issues, none from this task)
- Build: pass
- Knip: pass (1 pre-existing unused type, none from this task)
- Tests: pass (61/61)
- Acceptance criteria: all met
