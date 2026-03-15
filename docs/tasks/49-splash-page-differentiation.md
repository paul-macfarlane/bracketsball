# Task: Splash Page Differentiation & Redesign

**Story:** #49 from backlog.md
**Status:** ready-for-review
**Branch:** main (direct)

## Plan

- [x] Rewrite hero section with indie/friend-group positioning headline
- [x] Add "Not Your Typical Bracket App" comparison table (Bracketsball vs big apps)
- [x] Add stats-based bracket generation showcase with visual weight/chaos preview
- [x] Expand feature cards to 6 (multiple brackets, custom scoring, live scoring, potential points, one-link invites, built for groups)
- [x] Add "Built by a Fan, Not a Corporation" trust/indie section
- [x] Tighten "How It Works" section copy
- [x] Add accessibility improvements (sr-only text on comparison icons, aria-hidden on decorative SVG)
- [x] Update JSON-LD structured data with new feature list
- [x] Run /pre-review

## Open Questions

- None

## Decisions

### Comparison Table Approach

**Context:** Needed to communicate differentiators vs ESPN/Yahoo/CBS without being aggressive or naming competitors directly.
**Decision:** Used "The Big Apps" as a generic label. Listed 7 comparison rows — 5 where Bracketsball wins exclusively, 2 shared (live scoring, standings) to be honest and credible.
**Alternatives considered:** Side-by-side screenshots (too complex), named competitor callouts (too aggressive).

### Stats Preview Component

**Context:** The stats-based bracket generation feature is a key differentiator but hard to explain in text alone.
**Decision:** Created a static `StatsPreview` component that visually mimics the weight sliders and chaos level selector. Uses hardcoded sample data rather than pulling real config.
**Alternatives considered:** Screenshot of real UI (maintenance burden), animated demo (overkill for static page).

### Color for Comparison Checkmarks

**Context:** Original review flagged `text-green-600` as a hardcoded color violating standards.
**Decision:** Replaced with `text-brand-orange` to stay within the design system. Both check and X icons now use brand colors or muted foreground.

## Changes Made

- `app/page.tsx`: Complete rewrite of splash page content. New hero headline ("The Bracket App Your Group Chat Deserves"), comparison table section, stats-based generation showcase with visual preview, expanded 6-feature grid, indie/trust section, tightened How It Works copy, updated JSON-LD. Added new sub-components: `ComparisonRow`, `StatFeature`, `StatsPreview`. Added accessibility: `sr-only` text on check/X icons, `aria-hidden` on decorative SVG.
- `docs/business/backlog.md`: Added story #49 and updated summary table.

## Verification

- Self-code review: done (2 issues fixed — hardcoded green colors replaced with brand-orange, added screen reader text on comparison icons, added aria-hidden on decorative SVG)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met
