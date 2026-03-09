# Task: Icon Pack (Favicon, App Icons, OAuth)

**Story:** #30 from backlog.md
**Status:** ready-for-review
**Branch:** feature/icon-pack

## Plan

- [x] Design the "Bracket B" icon as SVG (bracket lines forming a "B", navy + orange palette)
- [x] Generate favicon set: icon-16.png, icon-32.png, icon.svg, apple-touch-icon.png (180x180), icon-192.png, icon-512.png
- [x] Create Open Graph image (og-image.png, 1200x630)
- [x] Create site.webmanifest for PWA support
- [x] Wire up icons in Next.js app metadata (icons, manifest, openGraph, twitter cards)
- [x] Update backlog status for stories 22-24 (carrying over from previous branch)
- [x] Clean up unused Next.js template SVGs from public/
- [x] Document OAuth provider icon upload steps (manual — Google Cloud Console + Discord Developer Portal)
- [x] Run /pre-review

## Open Questions

- OAuth provider icon uploads (Google Cloud Console, Discord Developer Portal) are manual steps the user must do — documented below

## Decisions

### SVG as Primary Icon Source

**Context:** Need icons at many sizes (16, 32, 180, 192, 512, OG 1200x630).
**Decision:** Created a master SVG (`public/icon.svg`) and a generation script (`scripts/generate-icons.ts`) using sharp to produce all PNG variants. The SVG is also served directly as a favicon for browsers that support it.
**Alternatives considered:** Creating PNGs manually in an image editor (not reproducible), using Next.js ImageResponse (doesn't support complex SVG paths well).

### Removed Old favicon.ico

**Context:** The original favicon.ico was a generic Next.js placeholder.
**Decision:** Replaced with SVG + PNG favicon set referenced in metadata. Modern browsers prefer SVG favicons; older browsers fall back to the 32x32 or 16x16 PNG.

## Changes Made

- `public/icon.svg`: New — master Bracket B icon (navy background, white B with bracket curves, orange accent marks and center dot)
- `public/icon-16.png`: New — 16x16 favicon PNG
- `public/icon-32.png`: New — 32x32 favicon PNG
- `public/icon-192.png`: New — 192x192 PWA icon
- `public/icon-512.png`: New — 512x512 PWA icon
- `public/apple-touch-icon.png`: New — 180x180 Apple touch icon
- `public/og-image.png`: New — 1200x630 Open Graph social sharing image
- `public/site.webmanifest`: New — PWA manifest with icon references, navy theme color
- `app/layout.tsx`: Updated metadata with icons, manifest, openGraph, and twitter card configuration
- `app/favicon.ico`: Removed (replaced by new icon set)
- `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`: Removed unused Next.js template assets
- `scripts/generate-icons.ts`: New — icon generation script using sharp
- `package.json`: Added `generate:icons` script, added sharp devDependency
- `docs/business/backlog.md`: Updated stories 22-24 status to Done, added checkmarks to story headings for 22, 23, 24, 29

## OAuth Provider Icon Upload (Manual Steps)

These require the app owner to do manually:

### Google Cloud Console

1. Go to https://console.cloud.google.com → APIs & Services → OAuth consent screen
2. Under "App information", upload the 512x512 icon (`public/icon-512.png`)
3. Save changes

### Discord Developer Portal

1. Go to https://discord.com/developers/applications
2. Select the Bracketsball application
3. Under "General Information", upload the icon (`public/icon-512.png`) as the app icon
4. Save changes

## Verification

- Self-code review: done (1 issue found — generate script had confusing favicon.ico dead code path; cleaned up to explicit PNG entries + added 32x32)
- Format: pass
- Lint: pass
- Build: pass
- Acceptance criteria: all met (OAuth uploads documented as manual steps; browser rendering requires manual testing)
