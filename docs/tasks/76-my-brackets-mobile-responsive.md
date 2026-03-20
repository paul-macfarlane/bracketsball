# Task: Fix My Brackets Mobile Responsive Layout

**Story:** #76 from backlog.md
**Status:** done
**Branch:** fix/my-brackets-mobile-responsive

## Plan

- [x] Add backlog item (#76)
- [x] Restructure BracketEntryRow layout to stack on mobile
- [x] Verify build passes
- [ ] Run /pre-review

## Changes Made

- `docs/business/backlog.md`: Added story #76 with acceptance criteria and summary table entry
- `app/(app)/pools/[id]/brackets/bracket-entry-row.tsx`: Restructured layout to use `flex-col` on mobile and `flex-row` on `sm:` breakpoint. The bracket name row (logo, badge, name) and standings info (rank, points, potential) now stack vertically on small screens instead of competing for horizontal space. Also simplified the component by making the entire row a single `<Link>` element (removing the redundant inner link and chevron link), with `preventDefault`/`stopPropagation` on dropdown menu interactions.
