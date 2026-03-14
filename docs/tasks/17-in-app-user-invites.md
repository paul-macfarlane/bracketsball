# Task: In-App User Invites

**Story:** #17 from backlog.md
**Status:** ready-for-review
**Branch:** feature/17-in-app-user-invites

## Plan

- [x] Step 1: Database schema — add poolUserInvite table with enum and relations
- [x] Step 2: Query layer — create pool-user-invites.ts with all query functions
- [x] Step 3: Validators — create pool-user-invite.ts with Zod schemas
- [x] Step 4: Permissions — add send-user-invite and cancel-user-invite actions
- [x] Step 5: Server actions — members/actions.ts and invites/actions.ts
- [x] Step 6: Invite sending UI — search dialog and sent invites list
- [x] Step 7: Invite receiving UI — invites page, notification badge in header

## Open Questions

None.

## Changes Made

- `lib/db/pool-schema.ts`: Added `poolUserInviteStatusEnum`, `poolUserInvite` table, `poolUserInviteRelations`
- `lib/db/schema.ts`: Re-exported new table and relations
- `lib/db/auth-schema.ts`: Added `sentUserInvites` and `receivedUserInvites` relations to userRelations
- `lib/db/migrations/0012_careful_scourge.sql`: Generated migration for new table
- `lib/db/queries/pool-user-invites.ts`: New query file with searchUsersByUsername, createPoolUserInvite, getPendingInvitesForUser, getPendingInviteCountForUser, respondToPoolUserInvite, getSentInvitesForPool, cancelPoolUserInvite, getPendingInviteIdsForPool
- `lib/validators/pool-user-invite.ts`: Zod schemas for sendPoolUserInvite and searchUsers
- `lib/permissions/pools.ts`: Added "send-user-invite" and "cancel-user-invite" actions for both leader and member roles
- `app/(app)/pools/[id]/members/actions.ts`: Added searchUsersForInviteAction, sendPoolUserInviteAction, cancelPoolUserInviteAction
- `app/(app)/invites/actions.ts`: Added respondToInviteAction
- `app/(app)/pools/[id]/members/invite-user-dialog.tsx`: Dialog with debounced username search and invite buttons
- `app/(app)/pools/[id]/members/sent-invites-list.tsx`: List of sent invites with status badges and cancel functionality
- `app/(app)/pools/[id]/page.tsx`: Integrated SentInvitesList component
- `app/(app)/invites/page.tsx`: Full page for viewing and responding to pending invites
- `app/(app)/invites/invite-response-list.tsx`: Client component for accept/decline with redirect on accept
- `app/(app)/app-header.tsx`: Added bell icon with notification badge for pending invites (desktop + mobile)
- `app/(app)/layout.tsx`: Fetches pending invite count and passes to AppHeader
- `app/(public)/layout.tsx`: Also fetches pending invite count for AppHeader when session exists

## Verification

- Self-code review: done (no issues — transactions, security, standards all correct)
- Format: run (no changes needed)
- Lint: pass (fixed one issue — `setResults` called synchronously in useEffect, refactored to derived state)
- Build: pass
- Acceptance criteria: all met
  - User can search for other users by username
  - Selected users receive an in-app invite notification (bell icon with badge + /invites page)
  - Invited users can accept or decline
