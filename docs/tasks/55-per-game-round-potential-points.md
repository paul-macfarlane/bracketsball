# Task: Per-Game & Round-Level Potential Points on Bracket

**Story:** #55 from backlog.md
**Status:** done
**Branch:** feature/bracket-potential-points

## Plan

- [x] Add per-game potential points display in matchup card footer
- [x] Compute per-round points summary (earned/remaining/lost) in BracketFullView
- [x] Add RoundHeader component with compact summary display
- [x] Wire round summaries through RegionBracket, RoundColumn, and R64WithFirstFour
- [x] Verify build passes cleanly

## Changes Made

- `components/bracket/matchup-card.tsx`: Extended footer to show potential points for non-final games — muted `+X pts` for pending picks with alive teams, red strikethrough for eliminated/incorrect picks
- `components/bracket/bracket-full-view.tsx`: Added `RoundPointsSummary` interface and `roundSummaries` computation (earned/remaining/lost per round). Added `RoundHeader` component replacing inline round labels with summary-aware headers. Threaded `roundSummaries` through RegionBracket, RoundColumn, and R64WithFirstFour props
- `docs/business/backlog.md`: Added story #55, updated summary table
