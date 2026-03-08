# Task: UX Cleanup Epic (Stories 22, 23, 24)

**Stories:** #22, #23, #24 from backlog.md
**Status:** ready-for-review
**Branch:** feature/ux-cleanup

## Plan

### Story 22: Remove User Dashboard

- [x] Change root redirect from `/dashboard` to `/pools` in `app/page.tsx`
- [x] Remove `app/(app)/dashboard/page.tsx`
- [x] Remove "Dashboard" link from nav in `app/(app)/app-header.tsx`
- [x] Update admin layout redirect from `/dashboard` to `/pools`
- [x] Update login page and login buttons redirects from `/dashboard` to `/pools`

### Story 23: Remove Admin Dashboard

- [x] Remove "Admin" dashboard link from `app/(app)/admin/admin-nav.tsx`
- [x] Change `app/(app)/admin/page.tsx` to redirect to `/admin/teams`

### Story 24: Auto-Determine Game Winner from Scores

- [x] Remove winner dropdown from `game-row.tsx` form
- [x] Auto-set winner based on scores when status is "final"
- [x] Handle tie case (no auto-set, show warning message)

## Changes Made

- `app/page.tsx`: Changed authenticated redirect from `/dashboard` to `/pools`
- `app/(app)/dashboard/page.tsx`: Deleted (user dashboard page removed)
- `app/(app)/app-header.tsx`: Removed "Dashboard" nav link, updated logo link to `/pools`
- `app/(app)/admin/layout.tsx`: Changed non-admin redirect from `/dashboard` to `/pools`
- `app/(auth)/login/page.tsx`: Changed post-login redirect from `/dashboard` to `/pools`
- `app/(auth)/login/login-buttons.tsx`: Changed OAuth callback URL from `/dashboard` to `/pools`
- `app/(app)/admin/page.tsx`: Replaced dashboard card grid with redirect to `/admin/teams`
- `app/(app)/admin/admin-nav.tsx`: Removed "Admin" dashboard link, removed unused `exact` property
- `app/(app)/admin/tournaments/[id]/games/game-row.tsx`: Removed winner dropdown; winner is now auto-determined from scores when status is "final" and scores differ; shows tie warning when scores are equal
