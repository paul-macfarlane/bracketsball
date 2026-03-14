# Ways of Working — Claude Code

How Claude Code operates on this project. Follow this process for every task.

---

## 1. Task Tracking

Before starting work, create or update a task file at `docs/tasks/<story-number>-<short-name>.md`.

```markdown
# Task: <Story title>

**Story:** #<number> from backlog.md
**Status:** in-progress | ready-for-review | done
**Branch:** <branch-name>

## Plan

- [ ] Step 1
- [ ] Step 2
- ...

## Open Questions

- ...

## Changes Made

- <file>: <what changed and why>
```

Update the checklist and "Changes Made" section as you go. This is the single source of truth for progress.

---

## 2. Clarifying Questions

Before writing code, review the acceptance criteria and ask clarifying questions when:

- Requirements are ambiguous or could be interpreted multiple ways
- There are UX decisions not specified in the story (e.g., where a feature lives in the UI, confirmation flows)
- Edge cases aren't covered by the acceptance criteria
- Implementation could go in meaningfully different directions
- The story depends on or affects other in-progress or planned work

Ask questions upfront rather than making assumptions. It's faster to align early than to rework later. Record any answers in the task file under `## Open Questions` (resolved).

---

## 3. Implementation Decision Log

Record non-obvious decisions in the task file under a `## Decisions` section.

```markdown
## Decisions

### <Short title>

**Context:** Why this came up
**Decision:** What was chosen
**Alternatives considered:** What else was evaluated
```

Keep entries short. Only log decisions where the "why" isn't obvious from the code.

---

## 4. Pre-Review (Self-Code Review + Checklist)

Before marking a task `ready-for-review`, run the `/pre-review` skill:

```
/pre-review <task-file-name>
```

Example: `/pre-review 9-create-bracket-entry`

This skill automates the full pre-review process:

1. **Self-code review** — launches a separate agent to review changes against acceptance criteria and code standards (transactions, security, naming)
2. **Automated checks** — runs `pnpm format`, `pnpm lint`, `pnpm build`, and `pnpm test`, fixing issues as needed
3. **Acceptance criteria verification** — confirms all criteria from `docs/business/backlog.md` are met
4. **Task file update** — adds a `## Verification` section with results

If you need to run individual checks manually:

- `pnpm format` — auto-format all files with Prettier
- `pnpm lint` — must pass with zero errors and zero warnings
- `pnpm build` — must compile with zero TypeScript errors
- `pnpm test` — must pass with zero failures

> **Note:** The auto-format hook in `.claude/settings.json` runs Prettier automatically on every file Claude edits, so formatting issues should be rare.

---

## 5. Human Review

After automated checks pass and the task is marked `ready-for-review`:

1. Claude Code summarizes what was done, key decisions, and anything needing human judgment
2. Human reviews the diff, task file, and any flagged items
3. Human approves, requests changes, or asks questions in the Claude Code session
4. Claude Code addresses feedback and updates the task file

Do not merge or mark `done` without human approval.

---

## 6. Feedback Loop

When feedback is given during a Claude Code session (corrections, preferences, patterns to follow or avoid):

1. **Standards** — If feedback reflects a general coding standard, update `docs/technical/standards.md`
2. **Domain knowledge** — If feedback clarifies business rules or intent, update `docs/business/originalVision.md` or `docs/business/backlog.md` as appropriate
3. **Ways of working** — If feedback changes this process, update this file
4. **CLAUDE.md** — If feedback is a persistent instruction for Claude Code behavior, update `CLAUDE.md`

Always confirm with the user before modifying existing docs. Note what was updated in the task file under a `## Doc Updates` section.

---

## Quick Reference

| What                   | Where                            |
| ---------------------- | -------------------------------- |
| Task progress          | `docs/tasks/<task>.md`           |
| Acceptance criteria    | `docs/business/backlog.md`       |
| Code standards         | `docs/technical/standards.md`    |
| Architecture decisions | Task file `## Decisions` section |
| Process rules          | This file                        |
