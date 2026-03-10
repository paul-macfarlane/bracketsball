# Codebase Standards

## Project Structure

```
app/                    # Next.js App Router pages and layouts
  (auth)/               # Auth-related routes (grouped, no URL segment)
  (app)/                # Authenticated app routes (grouped)
  api/                  # API route handlers
components/
  ui/                   # ShadCN components (managed by CLI, don't edit directly)
  [feature]/            # Feature-specific components (e.g., components/bracket/)
lib/                    # Shared utilities, constants, types
  db/                   # Database client, schema, queries (Drizzle ORM)
  auth/                 # Better Auth config and helpers
  validators/           # Zod schemas for forms and API input
hooks/                  # Custom React hooks
types/                  # Shared TypeScript types (when not colocated)
public/                 # Static assets
docs/                   # Documentation
```

**Rules:**

- Colocate files with their route when they're route-specific (e.g., a loading.tsx or a component only used by one page lives in that route folder).
- Shared components go in `components/`. Feature-specific components get a subfolder.
- One component per file. File name matches the default export.

## Naming Conventions

| Thing                 | Convention       | Example                 |
| --------------------- | ---------------- | ----------------------- |
| Files/folders         | kebab-case       | `pool-settings.tsx`     |
| React components      | PascalCase       | `PoolSettings`          |
| Functions/variables   | camelCase        | `getPoolById`           |
| Types/interfaces      | PascalCase       | `Pool`, `BracketEntry`  |
| Constants             | UPPER_SNAKE_CASE | `MAX_BRACKETS_PER_USER` |
| Database tables       | snake_case       | `bracket_entries`       |
| Database columns      | snake_case       | `created_at`            |
| Environment variables | UPPER_SNAKE_CASE | `DATABASE_URL`          |

## TypeScript

- **Strict mode** is on — keep it on. No `any` unless absolutely necessary (and add a comment explaining why).
- Prefer `interface` for object shapes that could be extended. Use `type` for unions, intersections, and computed types.
- Use the `@/*` path alias for imports (already configured in tsconfig).
- Export types alongside their related code. Only use `types/` for types shared across 3+ files.
- Use `satisfies` for type-safe object literals when you need both inference and validation.

## React & Next.js

- **Server Components by default.** Only add `"use client"` when you need interactivity, hooks, or browser APIs.
- Use Next.js file conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Data fetching happens in Server Components or Route Handlers — no `useEffect` for fetching data.
- Use `next/image` for all images. Use `next/link` for all internal navigation.
- Prefer Server Actions for mutations. Use Route Handlers (`app/api/`) only for webhooks, cron endpoints, and external API consumption.

## Forms

- Use **React Hook Form** for all forms with client-side interactivity.
- Validate with **Zod** schemas. Share schemas between client validation and server-side validation.
- Place Zod schemas in `lib/validators/` so they're reusable.
- Use ShadCN's `<Form>` components which integrate with React Hook Form.

## UI & Styling

- Use **ShadCN components** as the base. Don't install competing component libraries.
- Don't edit files in `components/ui/` directly — use the ShadCN CLI to add/update components. Customization goes in wrapper components or via Tailwind theme config.
- Use **Tailwind utility classes** for styling. No CSS modules, no inline `style` props.
- **Responsive design: mobile-first.** Use Tailwind breakpoints (`sm:`, `md:`, `lg:`). All pages must be usable on mobile screens (375px+). On mobile: stack layouts vertically, reduce padding/gaps, hide secondary information (e.g., show name only instead of avatar + name + username), use icon-only buttons where text labels overflow, and provide separate mobile layouts (e.g., card lists instead of tables) when the desktop layout doesn't fit.
- Dark mode: support it via Tailwind's `dark:` variant. Use CSS variables from ShadCN's theme for colors.
- **No arbitrary color values.** Always use CSS variable-based Tailwind classes (`text-muted-foreground`, `bg-destructive`, `border-border`, etc.) instead of raw color classes (`text-yellow-500`, `bg-red-500/10`, etc.). This ensures consistency across light/dark themes and keeps the design system centralized.
- **New semantic colors require CSS variables.** When you need a color not covered by the existing theme (e.g., success/failure states), define new CSS variables in `globals.css` for both `:root` and `.dark`, register them in the `@theme inline` block, and use the resulting Tailwind classes (`bg-success`, `text-failure-foreground`, etc.). Never use hardcoded Tailwind color classes like `bg-green-600` or `text-red-700` — always go through the CSS variable system.
- Avoid magic numbers in class names. Use Tailwind's spacing/sizing scale.

## Database

- Use **Drizzle ORM** with **Neon** serverless Postgres.
- Define schema in code (`lib/db/schema.ts`). Migrations are version-controlled.
- All queries go through dedicated functions in `lib/db/queries/` — no inline SQL in components or route handlers.
- **Use transactions for multi-step writes.** Any function that performs more than one database write (insert, update, or delete) must wrap them in `db.transaction(async (tx) => { ... })`. Use `tx` instead of `db` for all queries inside the transaction. This ensures atomicity — either all writes succeed or none do.
- Always parameterize queries. Never interpolate user input into SQL strings.
- Use raw SQL only for complex queries that Drizzle can't express cleanly.

## Auth

- **Better Auth** handles all authentication. Don't roll custom auth logic.
- Auth config lives in `lib/auth/`.
- Protect routes using middleware or server-side session checks — never rely solely on client-side checks.
- Use Better Auth's session helpers in Server Components and Route Handlers.

## API Routes & Server Actions

- Validate all input at the boundary using Zod.
- Return consistent error shapes: `{ error: string }` with appropriate HTTP status codes.
- Server Actions should call shared query functions from `lib/db/queries/` — keep the action thin.
- Cron endpoints (hit by cron-job.org) should verify a shared secret via an `Authorization` header.

## Error Handling

- Use Next.js `error.tsx` boundaries for route-level errors.
- Use `notFound()` from `next/navigation` when a resource doesn't exist — don't return 404 manually.
- Log errors server-side. Don't expose internal error details to the client.
- Handle expected errors (validation, not-found, unauthorized) explicitly. Let unexpected errors bubble to the error boundary.

## Environment Variables

- All env vars go in `.env.local` (not committed). Document required vars in `.env.example`.
- Access server-only env vars directly via `process.env`. For client-side vars, prefix with `NEXT_PUBLIC_`.
- Validate env vars at startup (e.g., a simple check in `lib/env.ts` that throws if required vars are missing).

## Testing

- **Deferred to post-MVP.** Testing will be added after all MVP stories are complete.
- When added, use **Vitest** as the test runner.
- Test business logic and data access functions. Don't unit-test trivial React rendering.
- Integration tests for API routes and Server Actions.
- Use a test database (separate Neon branch or local Postgres).

## Linting & Formatting

- **ESLint**: `eslint-config-next` (core-web-vitals + typescript) + `eslint-config-prettier` (already configured).
- **Prettier**: Default config. Run `pnpm format` before committing.
- All code must pass `pnpm lint` and `pnpm build` (type-checking) with zero errors.

## Git

- Branch naming: `feature/<short-description>`, `fix/<short-description>`.
- Commit messages: imperative mood, concise. E.g., "Add pool creation form", "Fix bracket auto-save".
- Don't commit `.env.local`, `node_modules`, or `.next`.
- One logical change per commit. Don't mix refactors with features.
