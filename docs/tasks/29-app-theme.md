# Task: App Theme & Design System

**Story:** #29 from backlog.md
**Status:** ready-for-review
**Branch:** feature/app-theme

## Plan

- [x] Rename app from BRacketiering to Bracketsball across all user-facing references
- [x] Define new color palette ("Hardwood Classic") in CSS variables (light + dark mode)
- [x] Switch fonts from Geist to Barlow Condensed (headings) + Inter (body)
- [x] Update globals.css with new theme tokens
- [x] Create `docs/technical/design-system.md` documenting tokens and rationale
- [x] Apply heading font to login page, app header, CardTitle component
- [x] Visual review with user — validate palette and fonts look correct in light + dark mode
- [x] Apply any refinements based on feedback
- [x] Run /pre-review

## Open Questions

- None currently

## Decisions

### Font Loading Strategy

**Context:** Barlow Condensed needs specific weights loaded vs Geist which loads all weights automatically.
**Decision:** Load weights 400, 500, 600, 700 for Barlow Condensed to cover regular through bold heading usage.
**Alternatives considered:** Loading only 600/700, but 400/500 may be useful for subtitles.

### brand-orange Custom Token

**Context:** ShadCN's `accent` token is used for subtle hover backgrounds (menu items), so making it bright orange would break hover states everywhere.
**Decision:** Added a custom `--brand-orange` / `--brand-orange-foreground` token pair for high-energy CTAs, while keeping `accent` as a warm subtle background.
**Alternatives considered:** Overriding `accent` with orange (too aggressive), using chart colors for orange (semantically wrong).

### Heading Font Application

**Context:** Barlow Condensed should apply to all headings but CardTitle renders as `<div>`, not `<h*>`.
**Decision:** Applied heading font via global CSS selector targeting `[data-slot="card-title"]` alongside h1-h6, keeping the ShadCN component file unmodified per code standards.
**Alternatives considered:** Directly editing `components/ui/card.tsx` (standards violation), manually adding font-heading to every heading (fragile).

## Changes Made

- `app/globals.css`: Complete theme overhaul — Hardwood Classic palette (navy + burnt orange + warm tones) in both light and dark modes. Added `--brand-orange` custom token. Switched font vars from Geist to Inter/Barlow Condensed. Added base layer rule for heading font on h1-h6 and `[data-slot="card-title"]`.
- `app/layout.tsx`: Switched from Geist/Geist_Mono to Inter/Barlow_Condensed font imports. Updated metadata title to "Bracketsball".
- `app/(auth)/login/page.tsx`: Renamed to "Bracketsball", added uppercase tracking-wide heading style.
- `app/(app)/app-header.tsx`: Renamed logo text to "Bracketsball", added font-heading + uppercase tracking.
- `CLAUDE.md`: Renamed to Bracketsball.
- `README.md`: Renamed to Bracketsball.
- `package.json`: Renamed to bracketsball.
- `docs/business/backlog.md`: Renamed all BRacketiering → Bracketsball. Updated Story 29 status to Done.
- `docs/business/originalVision.md`: Renamed to Bracketsball.
- `lib/espn-sync/espn-adapter.ts`: Updated User-Agent header.
- `docs/technical/design-system.md`: New file documenting the full design system.

## Verification

- Self-code review: done (1 issue found — CardTitle `font-heading` was a direct edit to ShadCN component; fixed by moving to global CSS selector)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
