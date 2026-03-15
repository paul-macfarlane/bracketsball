# Task: Codebase Standards Audit

**Story:** #42 from backlog.md
**Status:** ready-for-review
**Branch:** feature/tech-debt-cleanup

## Plan

- [x] Audit project structure standards
- [x] Audit naming conventions
- [x] Audit TypeScript standards (any usage, interface vs type, path aliases)
- [x] Audit React & Next.js standards (Server Components, data fetching, next/image, next/link)
- [x] Audit form standards (React Hook Form + Zod, schemas in lib/validators/)
- [x] Audit UI & styling standards (CSS variables, no raw colors, mobile-first)
- [x] Audit database standards (queries in lib/db/queries/, transactions, parameterized)
- [x] Audit API routes & server actions (Zod validation, thin actions, cron auth)
- [x] Audit error handling (error.tsx boundaries, notFound(), no leaked internals)
- [x] Fix all violations found
- [x] Verify pnpm lint, pnpm build pass

## Audit Results

### Violations Found & Fixed

1. **Raw color classes** — `app/(app)/admin/tournaments/[id]/teams/page.tsx:69`
   - Had `border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400`
   - Fixed: replaced with `border-warning/50 bg-warning/10 text-warning-foreground`
   - Added `--warning-foreground` CSS variable to `globals.css` (light + dark mode)
   - Registered `--color-warning-foreground` in `@theme inline` block

2. **Inline style prop** — `components/bracket/bracket-full-view.tsx:457`
   - Had `style={{ gap: "0.25rem" }}`
   - Fixed: replaced with Tailwind `gap-1` class

### Acceptable Exceptions (Not Fixed)

- **`text-[10px]` / `text-[9px]`** in bracket matchup cards and notification badges: Tailwind's smallest `text-xs` (12px) is too large for dense bracket layouts. Arbitrary values are acceptable for sizing — the standards only prohibit arbitrary _color_ values.
- **`bg-white`** in `components/ui/slider.tsx`: ShadCN UI component — standards say "Don't edit files in `components/ui/` directly."
- **`style={{ width: ... }}`** in `app/page.tsx:491`: Dynamic percentage width for progress bars — must use inline style for computed values.
- **`any` in `lib/db/index.ts:21`**: Documented with eslint-disable comment, needed for `DbClient` type compatibility across Neon and node-postgres drivers.

### Standards Passing (No Violations)

- **Project structure**: All files colocated correctly, shared components in `components/`, one component per file
- **Naming conventions**: All files/folders kebab-case, components PascalCase, functions camelCase
- **TypeScript**: No unnecessary `any`, `@/*` path alias used consistently throughout
- **React & Next.js**: Server Components by default, no `useEffect` for data fetching, proper use of `next/image` and `next/link`
- **Forms**: React Hook Form + Zod throughout, schemas in `lib/validators/`
- **Database**: All queries in `lib/db/queries/`, transactions for multi-step writes, parameterized queries
- **API Routes & Server Actions**: Zod validation at all boundaries, thin actions calling shared query functions
- **Error handling**: Proper patterns throughout
- **File imports**: No deep relative imports — all use `@/` path alias
- **No CSS modules**: Only Tailwind utility classes used

## Changes Made

- `app/globals.css`: Added `--warning-foreground` CSS variable (light: `oklch(0.35 0.1 85)`, dark: `oklch(0.85 0.12 85)`) and registered in `@theme inline` block
- `app/(app)/admin/tournaments/[id]/teams/page.tsx`: Replaced raw yellow Tailwind classes with CSS variable-based warning classes
- `components/bracket/bracket-full-view.tsx`: Replaced inline `style={{ gap }}` with Tailwind `gap-1` class

## Verification

- Self-code review: done (no issues)
- Format: clean
- Lint: pass
- Build: pass
- Knip: pass
- Tests: pass (22/22)
- Acceptance criteria: all met
