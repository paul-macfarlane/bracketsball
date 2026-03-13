# SEO Plan — Bracketsball

## Overview

Bracketsball has a small public surface area: the splash page, login page, privacy policy, and terms of service. All authenticated app routes (pools, brackets, profile, admin) are private and should not be indexed.

## Implementation

### Metadata

- **Root layout** (`app/layout.tsx`) defines base metadata with `metadataBase` set via `NEXT_PUBLIC_SITE_URL` environment variable. This enables relative URLs in OG/canonical tags to resolve correctly.
- **Title template**: `"%s — Bracketsball"` — child pages set just their page name (e.g., "Privacy Policy") and the brand is appended automatically.
- **Default title**: `"Bracketsball — March Madness Bracket Challenge"` — used on the splash page.
- **Open Graph**: Full configuration including `siteName`, `locale`, `type`, and `url`.
- **Twitter Cards**: `summary_large_image` with dedicated image.

### Canonical URLs

Every public page defines `alternates.canonical` in its metadata export. This prevents duplicate content issues from query params, trailing slashes, or www/non-www variations.

| Page    | Canonical  |
| ------- | ---------- |
| Home    | `/`        |
| Login   | `/login`   |
| Privacy | `/privacy` |
| Terms   | `/terms`   |

### robots.txt

Generated via `app/robots.ts` using Next.js Metadata API.

- **Allowed**: `/`, `/privacy`, `/terms`, `/login`
- **Disallowed**: `/pools/`, `/profile/`, `/settings/`, `/admin/`, `/api/`
- Points to sitemap at `{SITE_URL}/sitemap.xml`

### sitemap.xml

Generated via `app/sitemap.ts` using Next.js Metadata API.

| URL        | Priority | Change Frequency |
| ---------- | -------- | ---------------- |
| `/`        | 1.0      | weekly           |
| `/login`   | 0.5      | monthly          |
| `/privacy` | 0.3      | yearly           |
| `/terms`   | 0.3      | yearly           |

### Structured Data (JSON-LD)

The splash page includes a `WebApplication` schema.org object:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Bracketsball",
  "applicationCategory": "SportsApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "featureList": ["Create bracket pools", "Fill NCAA tournament brackets", ...]
}
```

## Environment Variables

| Variable               | Purpose                                  | Default                 |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for canonical tags, OG, sitemap | `http://localhost:3000` |

This must be set in Vercel production environment to the production domain.

## Future Considerations

- **Dynamic OG images**: If pools or brackets become publicly shareable, generate dynamic OG images with pool/bracket details using `next/og`.
- **Public pools**: If story #18 (public/private toggle) ships, public pool pages would need their own metadata, sitemap entries, and potentially `noindex` toggles.
- **Blog/content**: If content marketing is added, those pages would need individual metadata and sitemap entries.
