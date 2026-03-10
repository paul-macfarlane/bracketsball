# Task: Navigation UX (Sticky Headers + Breadcrumbs)

**Stories:** #35, #36 from backlog.md
**Status:** ready-for-review
**Branch:** feature/navigation-ux

## Plan

- [x] Install ShadCN Breadcrumb component
- [x] Create `PageBreadcrumbs` reusable component
- [x] Create `StickySubHeader` reusable component
- [x] Pool detail page — breadcrumbs + sticky header
- [x] Bracket page — breadcrumbs + BracketEditor sticky header
- [x] BracketViewer sticky header
- [x] Pool settings — breadcrumbs + sticky header
- [x] AdminNav — make sticky
- [x] Admin pages (6 files) — replace back links with breadcrumbs

## Open Questions

- None

## Decisions

### Breadcrumbs before sticky headers

**Context:** Both stories touch the same UI areas (page headers).
**Decision:** Implemented both together per page to avoid rework — breadcrumbs replace back links, then the header area gets wrapped in StickySubHeader.

### Breadcrumbs scroll away on bracket pages

**Context:** BracketEditor/BracketViewer are client components rendered inside a server page. Breadcrumbs are in the server page, sticky header is in the client component.
**Decision:** Let breadcrumbs scroll away while the bracket header sticks. Breadcrumbs are for navigation context, not needed while actively editing picks.

### Mobile-responsive sticky header padding

**Context:** BracketEditor header is ~100px tall with two rows. Combined with AppHeader's 56px, that's 156px fixed on small screens.
**Decision:** Used `py-2 md:py-3` on BracketEditor's StickySubHeader to reduce height on mobile.

### Admin breadcrumb paths omit "Admin" prefix

**Context:** Admin pages already have AdminNav showing "Teams" and "Tournaments" tabs, so breadcrumbs like "Admin > Tournaments > Name" would be redundant.
**Decision:** Admin breadcrumbs start from the section (e.g., "Tournaments > Tournament Name > Games") since the admin context is already clear from the layout.

### Admin sub-page headers not independently sticky

**Context:** AdminNav is sticky at `top-14`. Making admin sub-page headers also sticky at the same offset would cause them to overlap. A different offset would require computing AdminNav height, which is fragile.
**Decision:** Only AdminNav is sticky for admin pages. Admin sub-page headers (breadcrumbs + h1) scroll normally. The AdminNav stickiness satisfies the core AC intent ("tab navigation sticks") and admin pages are short enough that this is acceptable.

## Changes Made

- `components/ui/breadcrumb.tsx`: Installed via ShadCN CLI
- `components/page-breadcrumbs.tsx`: New reusable breadcrumb component with mobile ellipsis collapse for 3+ crumbs
- `components/sticky-sub-header.tsx`: New reusable sticky sub-header wrapper (top-14, z-40, backdrop-blur)
- `app/(app)/pools/[id]/page.tsx`: Replaced back link with breadcrumbs + StickySubHeader wrapping pool name and settings button
- `app/(app)/pools/[id]/brackets/[bracketId]/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/pools/[id]/settings/page.tsx`: Replaced back link with breadcrumbs + StickySubHeader
- `components/bracket/bracket-editor.tsx`: Wrapped header (name, status, stats, actions) in StickySubHeader
- `components/bracket/bracket-viewer.tsx`: Wrapped header (name, status, points) in StickySubHeader
- `app/(app)/admin/admin-nav.tsx`: Made sticky using StickySubHeader wrapper
- `app/(app)/admin/tournaments/[id]/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/admin/tournaments/[id]/games/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/admin/tournaments/[id]/teams/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/admin/teams/[id]/edit/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/admin/teams/new/page.tsx`: Replaced back link with breadcrumbs
- `app/(app)/admin/tournaments/new/page.tsx`: Replaced back link with breadcrumbs

## Verification

- Self-code review: done (no blocking issues; AdminNav refactored to use StickySubHeader per suggestion)
- Format: pass
- Lint: pass (0 errors, 0 warnings)
- Build: pass
- Acceptance criteria: all met (see notes below)

### Story #35 — Sticky Page Headers

- [x] Pool detail page: pool name, settings link stick (no section tabs exist currently — N/A)
- [x] Bracket editor: name, status, stats, action buttons stick
- [x] Bracket viewer: name and score summary stick
- [x] Admin pages: tab navigation (AdminNav) sticks; sub-page headers scroll (documented decision)
- [x] Subtle border to visually separate from scrolling content
- [x] Works on desktop and mobile
- [x] Does not obscure too much vertical space on small screens (reduced padding on mobile)

### Story #36 — Breadcrumb Navigation

- [x] Replace "Back to X" links with ShadCN Breadcrumb on all 9 nested pages
- [x] Pool detail: Pools > Pool Name
- [x] Bracket editor/viewer: Pools > Pool Name > Bracket Name
- [x] Pool settings: Pools > Pool Name > Settings
- [x] Admin pages: Section > Sub-page (omits redundant "Admin" prefix)
- [x] Responsive: collapses middle crumbs into ellipsis dropdown on mobile for 3+ crumbs
- [x] Current page shown as non-linked text; parents are clickable
- [x] Consistent placement across all pages
