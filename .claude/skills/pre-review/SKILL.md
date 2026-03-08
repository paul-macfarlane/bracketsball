---
name: pre-review
description: Run the full pre-review checklist from ways-of-working.md before marking a task ready for review
user-invocable: true
---

Run the complete pre-review checklist for the current task. Follow these steps exactly:

## Step 1: Identify the Task

Find the current task file in `docs/tasks/`. If `$ARGUMENTS` is provided, use it as the task file name or story number. Otherwise, infer the current task from the git branch name or recent changes.

Read the task file to understand what was done.

## Step 2: Self-Code Review (via separate agent)

Launch a **separate agent** (use the Agent tool) to perform the self-code review. The agent must:

1. Read the task file (`docs/tasks/<task>.md`) to understand what was done
2. Read the relevant story from `docs/business/backlog.md` for acceptance criteria
3. Read `docs/technical/standards.md` for code standards
4. Review all files listed in "Changes Made" against the criteria and standards
5. Pay special attention to:
   - **Transactions**: Any function with multiple DB writes must use a transaction. Server actions calling multiple write functions must wrap them in a single transaction, passing `tx` to each.
   - **Security**: Auth checks, input validation, ownership verification.
   - **Standards compliance**: Naming, file organization, error handling patterns.
6. Report: criteria coverage, standards violations, and suggestions. **Do not modify code.**

If the review agent finds issues, fix them before proceeding.

## Step 3: Run Automated Checks

Run these commands sequentially and report results:

1. `pnpm format` — auto-format all files
2. `pnpm lint` — must pass with zero errors and zero warnings
3. `pnpm build` — must compile with zero TypeScript errors

If any check fails, fix the issue and re-run until all pass.

## Step 4: Verify Acceptance Criteria

Compare the implementation against all acceptance criteria from the backlog story. List each criterion and confirm it's met.

Verify:
- No unrelated changes are included
- Code follows `docs/technical/standards.md`

## Step 5: Update Task File

Add a `## Verification` section to the task file:

```markdown
## Verification

- Self-code review: done (issues found / no issues)
- Format: run
- Lint: pass/fail
- Build: pass/fail
- Acceptance criteria: all met / <list gaps>
```

## Step 6: Summary

Provide a summary to the user of:
- What was reviewed
- Any issues found and fixed
- Final status of all checks
- Whether the task is ready for human review
