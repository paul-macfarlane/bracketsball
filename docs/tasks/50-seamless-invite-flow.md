# Task: Seamless Invite Link Flow for Unauthed / New Users

**Story:** #50 from backlog.md
**Status:** ready-for-review
**Branch:** feature/50-seamless-invite-flow

## Plan

- [x] Move invite route from `(app)` (auth-gated) to `(public)` (supports both authed/unauthed)
- [x] Create public invite page with 3-state logic (unauthed preview, authed auto-join, authed manual join)
- [x] Create `InvitePreviewCard` for unauthed users with "Sign in to Join" CTA
- [x] Add `?autoJoin=true` parameter carried through OAuth flow for automatic pool joining
- [x] Add inviter name to invite preview
- [x] Add pool-full check visible to unauthed users
- [x] Delete old `(app)/invite/[code]` route

## Changes Made

- **`app/(public)/invite/[code]/page.tsx`** — New public invite page with 3-state logic: unauthed preview, authed+autoJoin (server-side redeem & redirect), authed without autoJoin (manual accept card). All validations (invalid, expired, exhausted, tournament started, pool full) run before auth check so errors are visible to everyone.
- **`app/(public)/invite/[code]/invite-preview-card.tsx`** — New component for unauthed users showing pool name, inviter name, role badge, and "Sign in to Join" CTA that links to `/login?callbackUrl=/invite/[code]?autoJoin=true`.
- **`app/(public)/invite/[code]/invite-accept-card.tsx`** — Moved from `(app)`, unchanged. Used for authed users visiting without `autoJoin`.
- **`app/(public)/invite/[code]/actions.ts`** — Moved from `(app)`, unchanged. Server action for manual accept flow.
- **`lib/db/queries/pool-invites.ts`** — Added `inviterName` field to `getPoolInviteByCode` query via user table join.
- **`app/(app)/invite/[code]/`** — Deleted entire directory.

## Verification

- Self-code review: done (fixed: added inviter name, added pool-full check for unauthed users)
- Format: pass
- Lint: pass
- Build: pass
- Knip: pass
- Acceptance criteria: all met
