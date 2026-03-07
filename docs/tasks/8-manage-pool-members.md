# Task: Manage Pool Members

**Story:** #8 from backlog.md
**Status:** ready-for-review
**Branch:** feature/manage-pool-members

## Plan

- [x] Add ShadCN alert-dialog component (needed for confirmation dialogs)
- [x] Add new permissions to `lib/permissions/pools.ts` (remove-member, change-role)
- [x] Add pool member query functions to `lib/db/queries/pool-members.ts`
  - `getPoolMembers(poolId)` - list members with user details
  - `updatePoolMemberRole(memberId, role)` - change role
  - `removePoolMember(memberId)` - hard delete member (and future brackets)
  - `leavePool(poolId, userId)` - self-removal with pool deletion if last member
  - `getLeaderCount(poolId)` - count leaders for last-leader check
  - `getPoolMemberCount(poolId)` - count members
- [x] Add server actions in `app/(app)/pools/[id]/members/actions.ts`
  - `changeMemberRoleAction`
  - `removeMemberAction`
  - `leavePoolAction`
- [x] Add member list UI component `app/(app)/pools/[id]/members/member-list.tsx`
  - Shows all members with name, avatar, role
  - Leaders see role select dropdown and remove button per member (not for themselves)
  - Members see read-only list with role badges
- [x] Add leave pool button component `app/(app)/pools/[id]/members/leave-pool-button.tsx`
  - Confirmation dialog warning about bracket deletion
  - Handles last-leader (disabled), sole-member (pool deletion), and normal cases
- [x] Integrate member list into pool detail page
- [x] Run format, lint, build checks

## Open Questions

None - all clarified with user before starting.

## Decisions

### No bracket entry cleanup needed yet

**Context:** Story says removing a member hard-deletes their bracket entries, but bracket entry tables don't exist yet (Story #9).
**Decision:** Implement member removal as just deleting the pool_member row. Add a TODO comment for bracket entry cleanup when that schema is added.

## Changes Made

- `components/ui/alert-dialog.tsx`: Added ShadCN alert-dialog component
- `components/ui/button.tsx`: Updated by ShadCN CLI
- `lib/permissions/pools.ts`: Added "change-member-role" and "remove-member" pool actions
- `lib/db/queries/pool-members.ts`: New file with member management queries (list, role change, remove, leave, counts)
- `app/(app)/pools/[id]/members/actions.ts`: Server actions for role change, member removal, and leaving pool
- `app/(app)/pools/[id]/members/member-list.tsx`: Client component showing member list with leader controls
- `app/(app)/pools/[id]/members/leave-pool-button.tsx`: Client component with confirmation dialog for leaving
- `app/(app)/pools/[id]/page.tsx`: Integrated member list into pool detail page

## Verification

- Format: run
- Lint: pass
- Build: pass
- Acceptance criteria: all met
