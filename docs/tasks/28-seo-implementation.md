# Task: SEO Plan & Implementation

**Story:** #28 from backlog.md
**Status:** ready-for-review
**Branch:** feature/seo-implementation

## Plan

- [x] Add `NEXT_PUBLIC_SITE_URL` env var
- [x] Update root layout metadata with canonical URL, full OG config
- [x] Add metadata to login page
- [x] Create `robots.ts` (Next.js metadata API)
- [x] Create `sitemap.ts` (Next.js metadata API)
- [x] Add JSON-LD structured data to splash page
- [x] Set canonical URLs on all public pages
- [x] Create `docs/technical/seo-plan.md`
- [x] Run build to verify everything compiles

## Decisions

### Use Next.js Metadata API for robots.txt and sitemap.xml

**Context:** Next.js supports both static files in `/public` and dynamic generation via `robots.ts`/`sitemap.ts` in the app directory.
**Decision:** Use the metadata API (`app/robots.ts`, `app/sitemap.ts`) for type-safe, maintainable generation.
**Alternatives considered:** Static files in `/public` — less flexible, no type safety.

### Use NEXT_PUBLIC_SITE_URL env var for canonical URLs

**Context:** Need a production site URL for canonical tags, OG URLs, and sitemap.
**Decision:** Add `NEXT_PUBLIC_SITE_URL` with fallback to `http://localhost:3000` for dev.
**Alternatives considered:** Hardcoding the URL — less flexible across environments.

## Changes Made

- `app/layout.tsx`: Added metadataBase, canonical URL, enhanced OG/Twitter metadata
- `app/page.tsx`: Added JSON-LD structured data (WebApplication schema)
- `app/(auth)/login/page.tsx`: Added page-specific metadata
- `app/robots.ts`: New file — dynamic robots.txt generation
- `app/sitemap.ts`: New file — dynamic sitemap.xml generation
- `.env.example`: Added NEXT_PUBLIC_SITE_URL
- `docs/technical/seo-plan.md`: New file — SEO strategy documentation

## Verification

- Self-code review: done (no issues — minor suggestions noted as non-blocking)
- Format: pass
- Lint: pass (zero errors, zero warnings)
- Build: pass (zero TypeScript errors)
- Acceptance criteria: all met (Lighthouse score ≥ 90 cannot be verified without deployed environment)

### Acceptance Criteria Checklist

- [x] Metadata: proper `<title>`, `<meta description>`, OG/Twitter Card tags on all public pages
- [x] `robots.txt` allows crawling of public pages, disallows authenticated app routes
- [x] `sitemap.xml` generated for public pages
- [x] Structured data (JSON-LD) for the splash page (WebApplication schema)
- [x] Canonical URLs set on all pages
- [ ] Lighthouse SEO score ≥ 90 on splash page (requires deployed environment to verify)
- [x] Document SEO strategy in `docs/technical/seo-plan.md`
