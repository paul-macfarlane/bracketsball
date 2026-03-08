# BRacketiering

March Madness bracket challenge app where users compete in pools by predicting NCAA tournament game outcomes.

## Tech Stack

Next.js (TypeScript), Postgres (Neon), ShadCN + Tailwind, Drizzle ORM, Better Auth (Google/Discord), Vercel.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (for local Postgres) or a [Neon](https://neon.tech) database

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables and fill in your values
cp .env.example .env.local

# Start local Postgres (optional — skip if using Neon)
docker compose up -d

# Run database migrations
pnpm db:migrate

# Seed data
pnpm db:seed:teams
pnpm db:seed:tournament

# Start dev server
pnpm dev
```

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Run Prettier |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Documentation

See the `docs/` directory for detailed documentation:

- **Business** — product vision, scoring rules, and backlog (`docs/business/`)
- **Technical** — stack details, code standards, and development process (`docs/technical/`)
