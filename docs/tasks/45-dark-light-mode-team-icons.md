# 45. Dark/Light Mode Team Icons

**Story:** #45 — Dark/Light Mode Team Icons
**Epic:** Bracket UX Enhancements
**Status:** Ready for Review

## Summary

Added theme-aware team logo rendering across the app. ESPN provides dark-mode logo variants at `https://a.espncdn.com/i/teamlogos/ncaa/500-dark/{espnId}.png`. A new `darkLogoUrl` column stores these URLs, and a reusable `TeamLogo` client component uses `next-themes` `resolvedTheme` to pick the appropriate logo based on the user's current theme.

## Changes Made

### Schema & Migration

- `lib/db/tournament-schema.ts` — added `darkLogoUrl: text("dark_logo_url")` column to `team` table
- `lib/db/migrations/0013_mature_white_queen.sql` — generated migration

### ESPN Sync Pipeline

- `lib/espn-sync/types.ts` — added `darkLogoUrl: string | null` to `SyncTeam`
- `lib/espn-sync/espn-adapter.ts` — construct dark logo URL using `500-dark/` CDN path
- `lib/espn-sync/sync.ts` — persist `darkLogoUrl` in `upsertTeam()` (insert, update, and onConflict)

### Validator & Admin

- `lib/validators/team.ts` — added `darkLogoUrl` field with same validation as `logoUrl`
- `app/(app)/admin/teams/team-form.tsx` — added Dark Logo URL input field
- `app/(app)/admin/teams/actions.ts` — destructure and pass `darkLogoUrl` in create/update actions
- `app/(app)/admin/teams/[id]/edit/page.tsx` — pass `darkLogoUrl` in default values

### Data Queries

- `lib/db/queries/teams.ts` — accept `darkLogoUrl` in `createTeam` and `updateTeam`
- `lib/db/queries/tournaments.ts` — added `teamDarkLogoUrl: team.darkLogoUrl` to `getTournamentTeams()` select
- `lib/db/queries/bracket-entries.ts` — added `darkLogoUrl` to champion pick team select and type annotations

### TeamLogo Component

- `components/team-logo.tsx` — **NEW** `"use client"` component using `useTheme().resolvedTheme`
  - Props: `logoUrl`, `darkLogoUrl`, `alt`, `className`
  - Returns dark logo when `resolvedTheme === "dark"` and `darkLogoUrl` is available
  - Falls back to `logoUrl` otherwise; returns `null` if no URL

### Frontend Type Updates

- `components/bracket/types.ts` — added `darkLogoUrl: string | null` to `BracketTeam`
- `components/pool/standings-table.tsx` — added `teamDarkLogoUrl` to `StandingsEntry.championPick`

### Logo Rendering Updates (7 sites)

- `components/bracket/matchup-card.tsx` — use `TeamLogo` in `TeamSlot`
- `components/bracket/team-comparison.tsx` — use `TeamLogo` for both team headers
- `components/pool/standings-table.tsx` — use `TeamLogo` in `ChampionDisplay`
- `app/(app)/admin/teams/page.tsx` — use `TeamLogo` in team list
- `app/(app)/admin/tournaments/[id]/games/game-row.tsx` — use `TeamLogo`, add `darkLogoUrl` to `TeamInfo`
- `app/(app)/admin/tournaments/[id]/games/page.tsx` — pass `teamDarkLogoUrl` to `GameRow`
- `app/(app)/admin/tournaments/[id]/teams/page.tsx` — use `TeamLogo` in tournament teams list

### Data Mapping

- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx` — map `darkLogoUrl: tt.teamDarkLogoUrl`
- `app/(app)/pools/[id]/brackets/actions.ts` — map `darkLogoUrl: tt.teamDarkLogoUrl` in auto-fill

## Verification

- Self-code review: done (1 issue found — added `onError` fallback to `TeamLogo` for robustness if dark logo URL 404s)
- Format: run
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met
