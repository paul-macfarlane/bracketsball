# Task: In-App User Invites

**Story:** #17 from backlog.md
**Status:** ready-for-review
**Branch:** feature/17-in-app-user-invites

## Plan

- [x] Step 1: Database schema — add poolUserInvite table with enum and relations
- [x] Step 2: Query layer — create pool-user-invites.ts with all query functions
- [x] Step 3: Validators — create pool-user-invite.ts with Zod schemas
- [x] Step 4: Permissions — add send-user-invite and cancel-user-invite actions
- [x] Step 5: Server actions — members/actions.ts and notifications/actions.ts
- [x] Step 6: Invite sending UI — search dialog and sent invites list (leader-only)
- [x] Step 7: Invite receiving UI — notifications page, notification badge in header
- [x] Step 8: Code review fixes — schemas to validators, tournament-start guards, /notifications rename, leader-only permissions

## Open Questions

None.

## Changes Made

- `lib/db/pool-schema.ts`: Added `poolUserInviteStatusEnum`, `poolUserInvite` table, `poolUserInviteRelations`
- `lib/db/schema.ts`: Re-exported new table and relations
- `lib/db/auth-schema.ts`: Added `sentUserInvites` and `receivedUserInvites` relations to userRelations
- `lib/db/migrations/0012_careful_scourge.sql`: Generated migration for new table
- `lib/db/queries/pool-user-invites.ts`: New query file with searchUsersByUsername, createPoolUserInvite, getPendingInvitesForUser, getPendingInviteCountForUser, respondToPoolUserInvite, getSentInvitesForPool, cancelPoolUserInvite, getPendingInviteIdsForPool
- `lib/validators/pool-user-invite.ts`: Zod schemas for sendPoolUserInvite, searchUsers, and all action input schemas (searchUsersInputSchema, sendUserInviteInputSchema, cancelUserInviteInputSchema, respondToInviteInputSchema)
- `lib/permissions/pools.ts`: Added "send-user-invite" and "cancel-user-invite" actions for leader role only
- `app/(app)/pools/[id]/members/actions.ts`: Added searchUsersForInviteAction, sendPoolUserInviteAction, cancelPoolUserInviteAction — all with leader permission checks and tournament-start guard on send
- `app/(app)/notifications/actions.ts`: Added respondToInviteAction with tournament-start guard on accept
- `app/(app)/invite/[code]/actions.ts`: Already had tournament-start guard on link invite accept (pre-existing)
- `app/(app)/pools/[id]/members/invite-user-dialog.tsx`: Dialog with debounced username search and invite buttons
- `app/(app)/pools/[id]/members/sent-invites-list.tsx`: List of sent invites with status badges, cancel functionality, and invite button hidden after tournament starts
- `app/(app)/pools/[id]/page.tsx`: Integrated SentInvitesList component (leader-only, with tournamentStarted prop)
- `app/(app)/notifications/page.tsx`: Notifications page for viewing and responding to pending pool invites
- `app/(app)/notifications/invite-response-list.tsx`: Client component for accept/decline with redirect on accept
- `app/(app)/app-header.tsx`: Added bell icon with notification badge linking to /notifications (desktop + mobile)
- `app/(app)/layout.tsx`: Fetches pending invite count and passes to AppHeader
- `app/(public)/layout.tsx`: Also fetches pending invite count for AppHeader when session exists

## Verification

- Self-code review: done (fixed S1 — added leader permission check to searchUsersForInviteAction)
- Format: run (no changes needed)
- Lint: pass
- Build: pass
- Acceptance criteria: all met
  - User can search for other users by username
  - Selected users receive an in-app notification (bell icon with badge + /notifications page)
  - Invites cannot be sent after the tournament has started
  - Accepting invites (direct and link) blocked after tournament starts
  - Only leaders can send, search for, and cancel direct invites
  - Invited users can accept or decline
