# Task: Auto-Fill Bracket Picks

**Story:** #25 from backlog.md
**Status:** ready-for-review
**Branch:** feature/auto-fill-bracket

## Plan

- [x] Create auto-fill algorithm utility (`lib/bracket-auto-fill.ts`)
  - Chalk strategy: higher seed (lower number) always wins
  - Weighted Random strategy: P(team wins) = opponent_seed / (team_seed + opponent_seed)
  - Random strategy: 50/50 coin flip
  - Processes games in round order, resolving teams from source game picks
  - Only fills unpicked games (never overwrites existing picks)
  - Also generates a random tiebreaker score (100-180 range)
- [x] Add batch save query (`savePicksBatch` in `lib/db/queries/bracket-entries.ts`)
  - Upsert multiple picks with transaction safety
- [x] Add `clearAllPicks` query for clear bracket feature
- [x] Add `autoFillBracketAction` server action
  - Accepts strategy type, runs algorithm server-side, batch-saves, returns new picks + tiebreaker
  - Auth + tournament-started + Zod validation
- [x] Add `clearBracketAction` server action
  - Deletes all picks and resets tiebreaker to 0
  - Auth + tournament-started + Zod validation
  - Unsubmits if bracket was submitted
- [x] Add auto-fill UI to `bracket-editor.tsx`
  - "Auto-Fill" dropdown button in header with Chalk, Weighted Random, and Random options
  - "Clear" button with confirmation dialog
  - Both disabled when bracket is submitted or tournament locked
- [x] Update `use-bracket-picks.ts` to support bulk pick updates (`applyBulkPicks`) and full clear (`clearAllPicks`)

### Additional work (beyond story AC)

- [x] Fix: Draft brackets no longer appear in pool standings (only submitted)
- [x] Fix: First Four play-in games vertically aligned with their R64 game
- [x] Mobile responsive improvements for bracket editor header, standings, members list, leave pool button
- [x] `savePicksBatch` transaction safety — wraps in own transaction when no parent tx provided
- [x] Added mobile responsiveness standard to `docs/technical/standards.md`
- [x] Added stories #35 (Sticky Page Headers) and #36 (Breadcrumb Navigation) to backlog

## Decisions

### Auto-fill runs server-side

**Context:** Could run the algorithm client-side or server-side
**Decision:** Server-side — the algorithm generates picks that need to be batch-saved in a transaction anyway, and it needs access to tournament teams/seeds
**Alternatives considered:** Client-side with sequential `savePickAction` calls (too many network requests)

### Weighted random formula

**Context:** Need a weighting formula for seed-based randomness
**Decision:** P(team wins) = opponent_seed / (team_seed + opponent_seed). A 1-seed vs 16-seed → 94% chance the 1 wins; 8 vs 9 → 53%
**Alternatives considered:** Flat upset probability, historical upset rates (over-engineered)

## Changes Made

- `lib/bracket-auto-fill.ts`: New file — auto-fill algorithm with chalk, weighted random, and random (50/50) strategies
- `lib/db/queries/bracket-entries.ts`: Added `savePicksBatch` (with transaction safety) and `clearAllPicks` queries; added `client: DbClient` param to `updateTiebreaker`; removed draft brackets from `getPoolStandings`; removed unused `currentUserId` param and `or` import
- `lib/validators/bracket-entry.ts`: Added `autoFillBracketSchema` and `clearBracketSchema` Zod schemas
- `app/(app)/pools/[id]/page.tsx`: Updated `getPoolStandings` call (removed `currentUserId`)
- `app/(app)/pools/[id]/brackets/actions.ts`: Added `autoFillBracketAction` and `clearBracketAction` server actions with Zod validation
- `components/bracket/use-bracket-picks.ts`: Added `applyBulkPicks` and `clearAllPicks` to hook return
- `components/bracket/bracket-editor.tsx`: Added Auto-Fill dropdown (Chalk, Weighted Random, Random) and Clear button; improved mobile header layout
- `components/bracket/bracket-full-view.tsx`: Replaced separate FirstFourColumn/placeholder with paired R64+FF rows for correct vertical alignment
- `components/pool/standings-table.tsx`: Simplified mobile standings; removed draft badge logic
- `app/(app)/pools/[id]/members/member-list.tsx`: Improved mobile layout (smaller avatars, tighter spacing, responsive controls)
- `app/(app)/pools/[id]/members/leave-pool-button.tsx`: Icon-only on mobile, text on sm+
- `docs/technical/standards.md`: Added mobile responsiveness guidance
- `docs/business/backlog.md`: Added stories #35 and #36; marked #25 in progress

## Verification

- Self-code review: done — issues found and fixed (transaction bugs, missing Zod validation, savePicksBatch transaction safety)
- Format: pass
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met
