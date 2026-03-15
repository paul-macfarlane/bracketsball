# Task: Stats-Based Bracket Generation

**Story:** #44 from backlog.md
**Status:** ready-for-review
**Branch:** feature/44-stats-based-bracket-generation

## Plan

- [x] Add `stats_custom` strategy type and config types to `lib/bracket-auto-fill.ts`
- [x] Implement stats-based pick algorithm (weighted composite score + chaos/upset probability)
- [x] Create Custom Auto-Fill dialog component with presets, weight sliders, chaos level
- [x] Update bracket-editor.tsx to add "Custom" option in auto-fill dropdown that opens the dialog
- [x] Update server action to handle `stats_custom` strategy (pass team stats to algorithm)
- [x] Update Zod validator to accept the new strategy + config payload
- [x] Store last-used config in localStorage for convenience
- [x] Test build passes

## Open Questions

- ~~"Pick by Stats" button in team comparison dialog~~ — Scrapped per user feedback (too much complexity)

## Decisions

### Chaos level probability mapping

**Context:** Need concrete numbers for Low/Medium/High chaos
**Decision:** Low = 5% upset chance, Medium = 20%, High = 40%
**Alternatives considered:** Continuous slider, but discrete levels are simpler UX

### Weight UI

**Context:** Story leaves implementation to developer discretion
**Decision:** Sliders with 0-10 range per stat category, grouped visually. Presets auto-populate sliders.
**Alternatives considered:** Numeric inputs, tiered dropdowns

### localStorage for config persistence

**Context:** User convenience — remember last-used preset/weights/chaos
**Decision:** Store in localStorage so it persists across sessions
**Alternatives considered:** Server-side storage (overkill for a preference)

## Changes Made

- `lib/bracket-auto-fill.ts`: Added `stats_custom` strategy, `StatsAutoFillConfig` types, `STAT_CATEGORIES`, `PRESETS` (4 presets), `ChaosLevel` type, and `pickWinnerByStats`/`computeTeamScore` functions
- `lib/validators/bracket-entry.ts`: Extended `autoFillBracketSchema` to accept `stats_custom` strategy with optional `statsConfig` (weights + chaos level)
- `app/(app)/pools/[id]/brackets/actions.ts`: Updated `autoFillBracketAction` to accept/validate/pass stats config, and to include team stats in `BracketTeam` objects when using stats strategy
- `components/bracket/stats-auto-fill-dialog.tsx`: New dialog component with preset selector, chaos level selector, per-stat weight sliders (0-10), localStorage persistence
- `components/bracket/bracket-editor.tsx`: Added "Custom (Stats-Based)" option to auto-fill dropdown, wired up dialog open/close/generate
- `components/ui/slider.tsx`: Added ShadCN slider component (auto-generated)

## Verification

- Self-code review: done (4 issues found and fixed)
  - Fixed: localStorage data now validated with shape check before use
  - Fixed: Zod schema now requires `statsConfig` when strategy is `stats_custom` (`.refine()`)
  - Fixed: Consolidated triple `loadSavedConfig()` call into single lazy init
  - Fixed: Tied composite scores now resolved with coin flip instead of team1 bias
  - Fixed: `STAT_GROUPS` moved to module scope to avoid recomputation on every render
- Format: pass
- Lint: pass (0 errors, 0 warnings)
- Build: pass (0 TypeScript errors)
- Tests: pass (22/22)
- Acceptance criteria: all met (16 criteria checked; 1 scrapped per user feedback)
