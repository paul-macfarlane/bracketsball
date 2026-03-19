# Task: Additional Auto-Fill Presets (BPI, SOS/SOR)

**Story:** #71 from backlog.md
**Status:** done
**Branch:** feat/auto-fill-bpi-sos-presets

## Plan

- [x] Add BPI-Focused preset to `PRESETS` in `lib/bracket-auto-fill.ts`
- [x] Add Strength of Schedule & Record preset
- [x] Add Analytics Combined (BPI + SOS/SOR) preset
- [x] Update `PresetName` type union
- [x] Update `VALID_PRESETS` set in `stats-auto-fill-dialog.tsx`
- [x] Remove `invertedHint` property from stat category definitions
- [x] Remove inverted hint rendering from dialog component

## Changes Made

- `lib/bracket-auto-fill.ts`: Added 3 new presets (`bpi_focused`, `strength_focused`, `analytics_combined`) to `PRESETS` and `PresetName` type. Removed `invertedHint` property from `STAT_CATEGORIES` type and all entries.
- `components/bracket/stats-auto-fill-dialog.tsx`: Added new preset names to `VALID_PRESETS` validation set. Removed inverted hint rendering from stat label display.
