# Task: Improved Delete Confirmations

**Story:** #43 from backlog.md
**Status:** ready-for-review
**Branch:** feature/40-43-footer-github-delete-confirmations

## Plan

- [x] Pool deletion: Change confirmation to require typing pool name instead of "DELETE"
- [x] Account deletion: Replace card form with AlertDialog popup modal (confirm/cancel, no typing required)
- [x] Run /pre-review

## Changes Made

- `app/(app)/pools/[id]/settings/delete-pool-form.tsx`: Changed confirmation from typing "DELETE" to typing the pool name
- `app/(app)/pools/[id]/settings/page.tsx`: Pass pool name prop to DeletePoolForm
- `app/(app)/settings/delete-account-form.tsx`: Replaced card form with AlertDialog popup modal, updated warning text
- `lib/db/queries/users.ts`: Added pool membership deletion during account deletion (keeps bracket entries for historical standings)

## Verification

- Self-code review: done (1 issue fixed — AlertDialogAction auto-close prevented with e.preventDefault())
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
  - Pool deletion requires typing pool name: met
  - Account deletion uses popup modal with confirm/cancel: met
  - Both warn about permanent removal: met
  - Delete button disabled until condition met: met
