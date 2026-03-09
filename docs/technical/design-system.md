# Bracketsball Design System

Theme: **Hardwood Classic** — inspired by the tournament court aesthetic, deep school colors, and arena energy.

## Color Palette

### Semantic Tokens

| Token              | Light Mode                             | Dark Mode                           | Usage                                   |
| ------------------ | -------------------------------------- | ----------------------------------- | --------------------------------------- |
| `primary`          | Deep Navy `oklch(0.25 0.06 260)`       | Warm Light `oklch(0.90 0.01 80)`    | Buttons, active states, logo            |
| `secondary`        | Warm Tan `oklch(0.955 0.01 80)`        | Dark Navy `oklch(0.25 0.03 260)`    | Supporting UI, secondary buttons        |
| `accent`           | Warm Tan `oklch(0.955 0.01 80)`        | Dark Navy `oklch(0.25 0.03 260)`    | Hover backgrounds, menu item highlights |
| `brand-orange`     | Burnt Orange `oklch(0.65 0.2 45)`      | Bright Orange `oklch(0.70 0.19 45)` | CTAs, energy highlights, focus rings    |
| `success`          | Court Green `oklch(0.52 0.15 155)`     | Court Green `oklch(0.58 0.15 155)`  | Correct picks                           |
| `failure`          | Brick Red `oklch(0.52 0.2 25)`         | Brick Red `oklch(0.58 0.2 25)`      | Wrong picks                             |
| `destructive`      | Brick Red `oklch(0.55 0.2 25)`         | Brick Red `oklch(0.65 0.2 22)`      | Destructive actions                     |
| `background`       | Off-White `oklch(0.985 0.005 85)`      | Dark Navy `oklch(0.16 0.02 260)`    | Page background                         |
| `foreground`       | Near-Black Navy `oklch(0.15 0.02 260)` | Warm White `oklch(0.96 0.01 80)`    | Body text                               |
| `muted`            | Warm Gray `oklch(0.955 0.01 80)`       | Dark Gray `oklch(0.25 0.03 260)`    | Muted backgrounds                       |
| `muted-foreground` | Slate `oklch(0.50 0.02 260)`           | Slate `oklch(0.65 0.02 260)`        | Secondary text                          |
| `border`           | Warm Border `oklch(0.91 0.01 80)`      | White 10% `oklch(1 0 0 / 10%)`      | Borders, dividers                       |
| `ring`             | Burnt Orange `oklch(0.65 0.2 45)`      | Bright Orange `oklch(0.70 0.19 45)` | Focus rings                             |

### Custom Token: `brand-orange`

Used for high-energy UI elements that need to pop — call-to-action buttons on the splash page, highlight badges, and the focus ring. Available as `bg-brand-orange`, `text-brand-orange`, etc.

### Design Rationale

- **Navy primary** evokes classic college basketball programs (Duke, UConn, Villanova). Authoritative and readable.
- **Burnt orange accent** brings tournament energy and excitement. Used sparingly for maximum impact.
- **Warm tones** throughout (background, borders, secondary) echo the hardwood court and create a cohesive warmth vs. the cold neutrals of the previous theme.
- **OKLch color space** ensures perceptual uniformity — colors look consistent across devices.

## Typography

| Role         | Font             | Weight                   | Usage                           |
| ------------ | ---------------- | ------------------------ | ------------------------------- |
| **Headings** | Barlow Condensed | 600–700 (Semi-Bold/Bold) | h1–h6, nav logo, card titles    |
| **Body**     | Inter            | 400–500 (Regular/Medium) | Body text, form labels, buttons |

### Rationale

- **Barlow Condensed** is athletic and condensed — used on actual NCAA tournament signage and sports broadcasts. Strong without being gimmicky. Applied automatically to all h1–h6 elements via `globals.css`.
- **Inter** is highly readable with excellent rendering at small sizes. Warmer and more modern than Geist. Good pairing with a condensed heading font.

### How to Use

Headings (`h1`–`h6`) automatically get Barlow Condensed via the base layer in `globals.css`. For non-heading elements that should use the heading font, use:

```tsx
<span className="font-heading">Tournament</span>
```

Body text uses Inter by default via the `font-sans` CSS variable.

## Spacing & Layout

- Container max widths: `max-w-5xl` (main content), `max-w-2xl` (forms/profile)
- Standard padding: `px-4 py-6` (container), `p-4`/`p-6` (cards)
- Border radius: `0.625rem` base, scaled via `--radius-*` tokens

## Dark Mode

Both light and dark themes use the same Hardwood Classic palette family. Dark mode inverts to a deep navy background while keeping the warm orange accent vibrant. Dark mode is supported via `next-themes` with class-based toggling.

## Component Conventions

- **Primary buttons**: `variant="default"` — navy in light, warm light in dark
- **Orange CTA buttons**: Use `className="bg-brand-orange text-brand-orange-foreground hover:bg-brand-orange/90"` for high-emphasis CTAs
- **Cards**: Use ShadCN `Card` component — picks up `card`/`card-foreground` tokens
- **Success/failure indicators**: Use `text-success`/`text-failure` or `bg-success`/`bg-failure`
