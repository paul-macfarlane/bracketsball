# Task: Direct Invite Role Selection

**Story:** #48 from backlog.md
**Status:** done
**Branch:** feature/48-direct-invite-role-selection

## Plan

- [x] Add `role` column to `pool_user_invite` table schema
- [x] Generate and run DB migration
- [x] Update validator to include role field
- [x] Update `createPoolUserInvite` query to accept role
- [x] Update `respondToPoolUserInvite` to use invite's role when adding member
- [x] Update `getSentInvitesForPool` and `getPendingInvitesForUser` to return role
- [x] Update `sendPoolUserInviteAction` to accept and pass role
- [x] Add role selector (Select dropdown) to invite user dialog
- [x] Show role badge on sent invites list
- [x] Show leader badge on invite notifications for recipients
- [x] Add backlog story
- [x] Verify build passes

## Changes Made

- `lib/db/pool-schema.ts`: Added `role` column (poolMemberRoleEnum, default "member") to `poolUserInvite` table
- `lib/db/migrations/0015_small_puma.sql`: Migration to add role column
- `lib/validators/pool-user-invite.ts`: Added `role` field to `sendPoolUserInviteSchema`
- `lib/db/queries/pool-user-invites.ts`: Updated `createPoolUserInvite` to accept role, `respondToPoolUserInvite` to use invite's role, and both `getSentInvitesForPool`/`getPendingInvitesForUser` to return role
- `app/(app)/pools/[id]/members/actions.ts`: Updated `sendPoolUserInviteAction` to accept and pass role parameter
- `app/(app)/pools/[id]/members/invite-user-dialog.tsx`: Added role selector (Select dropdown) defaulting to "member"
- `app/(app)/pools/[id]/members/sent-invites-list.tsx`: Added role badge to sent invite items
- `app/(app)/notifications/invite-response-list.tsx`: Shows "Leader" badge when invite role is leader
- `docs/business/backlog.md`: Added story #48

## Verification

- Self-code review: done (1 issue found — migration missing `IF NOT EXISTS` guard, fixed)
- Format: run
- Lint: pass
- Build: pass
- Acceptance criteria: all met
  - Leader can choose role (member/leader) when sending direct invite: met (role selector in invite dialog)
  - Role stored on invite and used when accepted: met (schema + respondToPoolUserInvite uses invite.role)
  - Sent invites list shows role: met (role badge in sent-invites-list.tsx)
  - Recipient notification shows leader badge: met (conditional badge in invite-response-list.tsx)
  - Backward compatible default to "member": met (DB default, Zod default, schema default)
