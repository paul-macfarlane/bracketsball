# Task: Bracket Connector Lines

**Story:** #80 from backlog.md
**Status:** ready-for-review
**Branch:** feat/bracket-connector-lines

## Plan

- [x] Create `BracketConnector` component with classic L-shaped bracket lines
- [x] Add connector color computation logic (success/failure/muted based on pick status)
- [x] Modify `RoundColumn` to use flex-1 game wrappers (needed for connector alignment)
- [x] Modify `R64WithFirstFour` to use flex-1 game row wrappers
- [x] Add FF→R64 horizontal connectors within R64WithFirstFour rows
- [x] Insert connectors between rounds in `RegionBracket`
- [x] Add E8→FF cross-region connectors
- [x] Add FF→Championship connectors
- [x] Run pre-review

## Decisions

### Layout change from justify-around to flex-1 wrappers

**Context:** Connector lines need precise vertical alignment with game positions
**Decision:** Change RoundColumn from `justify-around` to individual `flex-1` game wrappers
**Alternatives considered:** Keeping `justify-around` and using calculated percentages — rejected because alignment wouldn't be reliable across different game counts

### CSS-only connector approach

**Context:** Connectors need to draw classic bracket L-shapes between rounds
**Decision:** Use absolutely positioned div elements with border CSS within relative-positioned flex-1 containers
**Alternatives considered:** SVG paths (more precise but adds complexity), Canvas (overkill), CSS pseudo-elements (harder to dynamically color)

### Per-arm coloring

**Context:** Need to show correct/incorrect pick status on connector lines
**Decision:** Each arm colored by its source game's pick status; output arm uses neutral color
**Alternatives considered:** Single color per connector pair, coloring by destination game — source-based is more intuitive (shows where the path broke)

## Open Questions

None — all clarified with user before implementation.

## Changes Made

- `components/bracket/bracket-connector.tsx`: New component for bracket connector lines
- `components/bracket/bracket-full-view.tsx`: Modified RoundColumn, R64WithFirstFour, and RegionBracket to support connectors

## Verification

- Self-code review: done (fixed inline style props → Tailwind classes, reverted unrelated migration metadata changes)
- Format: clean
- Lint: pass (1 error + 1 warning, both pre-existing, not from this PR)
- Build: pass
- Knip: pass (1 pre-existing unused export `RoundPointsSummary`, not from this PR)
- Tests: 61/61 pass
- Acceptance criteria: all 14 criteria met
