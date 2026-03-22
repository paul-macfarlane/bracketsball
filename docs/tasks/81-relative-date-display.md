# Task: Relative Date Display for Game Times

**Story:** N/A (UX improvement)
**Status:** done
**Branch:** feat/relative-date-display

## Plan

- [x] Create task file
- [x] Update `formatGameDateTime` in `lib/date-utils.ts` to show "Today" or "Tomorrow" instead of the date
- [x] Add unit tests for the new behavior in `lib/date-utils.test.ts`
- [x] Run pre-review checks

## Open Questions

None — confirmed with user: just "Today" / "Tomorrow" without the date.

## Changes Made

- `lib/date-utils.ts`: Added `getRelativeDatePart` helper that returns "Today", "Tomorrow", or formatted date. Updated `formatGameDateTime` to use it.
- `lib/date-utils.test.ts`: New test file with 8 tests covering Today, Tomorrow, future dates, past dates, includeWeekday, TBD, and string input.

## Verification

- Self-code review: done (1 issue found and fixed — timezone-sensitive TBD test)
- Format: pass
- Lint: pass (1 pre-existing error in `team-logo.tsx`, unrelated)
- Build: pass
- Knip: pass (1 pre-existing unused export in `bracket-full-view.tsx`, unrelated)
- Tests: 69/69 pass (all 3 test files)
- Acceptance criteria: N/A (UX improvement, no backlog story) — implementation matches user request
