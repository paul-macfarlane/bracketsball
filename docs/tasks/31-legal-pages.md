# Task: Legal & Contact Pages

**Story:** #31 from backlog.md
**Status:** ready-for-review
**Branch:** feature/legal-pages

## Plan

- [x] Create `(public)` route group for unauthenticated pages
- [x] Create Privacy Policy page at `/privacy`
- [x] Create Terms of Service page at `/terms`
- [x] Create shared footer component with links to privacy, terms, and contact email
- [x] Add footer to the authenticated app layout
- [x] Add footer to the login page
- [x] Style pages consistently with the Hardwood Classic theme
- [x] Run /pre-review

## Open Questions

- None

## Decisions

### Public Route Group

**Context:** Legal pages need to be accessible without authentication.
**Decision:** Created `(public)` route group with its own layout (header with logo, footer) separate from `(app)` which requires auth.
**Alternatives considered:** Putting pages directly in `app/privacy/` and `app/terms/` without a shared layout (would lack consistent header/footer).

### Tailwind Typography Plugin

**Context:** Legal pages are long-form content that needs proper typographic styling (headings, lists, paragraphs, links).
**Decision:** Added `@tailwindcss/typography` and used `prose` classes for clean content rendering.
**Alternatives considered:** Manually styling every element (tedious, inconsistent).

### Shared Footer Component

**Context:** Footer needs to appear on public pages, login page, and within the authenticated app.
**Decision:** Created `components/site-footer.tsx` as a shared component used across all three layouts.

## Changes Made

- `components/site-footer.tsx`: New — shared footer with copyright, privacy/terms links, and contact email
- `app/(public)/layout.tsx`: New — public route layout with logo header and footer
- `app/(public)/privacy/page.tsx`: New — privacy policy covering OAuth data, cookies, retention, deletion rights
- `app/(public)/terms/page.tsx`: New — terms of service covering acceptable use, pool participation, termination, liability
- `app/(app)/layout.tsx`: Added SiteFooter, switched to flex-col for footer pinning
- `app/(auth)/login/page.tsx`: Added SiteFooter, restructured for flex layout
- `app/globals.css`: Added `@tailwindcss/typography` plugin
- `package.json`: Added `@tailwindcss/typography` dependency

## Verification

- Self-code review: done (no issues)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
