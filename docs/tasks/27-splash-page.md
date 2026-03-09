# Task: Splash / Marketing Page

**Story:** #27 from backlog.md
**Status:** ready-for-review
**Branch:** feature/splash-page

## Plan

- [x] Convert root `app/page.tsx` from redirect to splash page (authed users still redirect to /pools)
- [x] Build hero section with bold headline, tagline, and orange CTA
- [x] Build "How It Works" section (3 steps)
- [x] Build features section (4 feature cards)
- [x] Build final CTA banner
- [x] Include splash header (logo + login/signup) and footer
- [x] Responsive design for mobile, tablet, desktop
- [x] SVG bracket illustration as background decoration
- [x] Dark mode support via design system tokens
- [x] Run /pre-review

## Open Questions

- None

## Decisions

### Inline Sub-components

**Context:** The splash page has Step, FeatureCard, and BracketDecoration helper components.
**Decision:** Kept them in the same file since they're small, non-exported, route-specific helpers. Extracting them would add files with no reuse benefit.
**Alternatives considered:** Separate files per component (overkill for non-reusable helpers).

### Server Component

**Context:** The splash page needs an auth check but no client interactivity.
**Decision:** Kept as a Server Component — the auth check runs server-side and the page is fully static HTML for unauthenticated users.

### Transparent Header Over Hero

**Context:** Marketing pages typically have the header overlaid on the hero for visual impact.
**Decision:** Used `absolute` positioning for the header with `text-primary-foreground` to sit over the `bg-primary` hero section. Login/signup buttons are visible above the fold.

## Changes Made

- `app/page.tsx`: Replaced redirect-only page with full splash/marketing page. Hero section (navy bg, bracket SVG watermark, bold headline with orange accent, CTA), How It Works (3 steps with orange icons), Features grid (4 cards), Final CTA banner, splash header with login/signup, footer.

## Verification

- Self-code review: done (1 minor issue fixed — replaced hardcoded `text-white` with `text-primary-foreground`)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
