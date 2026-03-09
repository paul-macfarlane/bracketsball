# Bracketsball Backlog

Derived from [Original Vision](./originalVision.md). Items are organized by epic and priority. All MVP epics come first, followed by non-MVP epics at the end.

---

## Epic: Tech Stack Setup

### 0. Tech Stack Setup (MVP) ✅

**As a** developer, **I want to** set up the core tech stack **so that** I have a working local development environment to build features on.

**Acceptance Criteria:**

- Local Postgres 17 runs via Docker Compose
- Drizzle ORM is installed and configured to connect to local Postgres
- Drizzle Kit is available for migrations and schema management
- ShadCN UI is initialized with Tailwind CSS
- React Hook Form is installed
- `pnpm dev` starts Next.js with a working connection to the local database
- `pnpm db:push` (or equivalent) applies Drizzle schema to the local database
- README or docs include instructions for getting started locally

---

## Epic: Auth

### 1. Social Login (MVP) ✅

**As a** user, **I want to** sign up and log in with Google or Discord **so that** I can quickly access the app without creating a new password.

**Acceptance Criteria:**

- User can sign up / log in via Google OAuth
- User can sign up / log in via Discord OAuth
- On first login, a profile is auto-created with name, username, and profile picture pulled from the OAuth provider
- Sessions are managed securely via Better Auth
- Unauthenticated users are redirected to login

---

## Epic: Profile

### 2. Profile Management (MVP) ✅

**As a** user, **I want to** edit my username, name, and profile picture URL **so that** I can personalize my identity in the app.

**Acceptance Criteria:**

- User can update their display name
- User can update their username (must be unique; show validation error if taken)
- User can update their profile picture URL
- Changes persist immediately

---

## Epic: Account

### 3. Account Deletion (MVP) ✅

**As a** user, **I want to** delete my account **so that** my data is removed from the platform.

**Acceptance Criteria:**

- User can initiate account deletion from settings
- Deletion requires confirmation (e.g., type "DELETE" or confirm dialog)
- Once deleted, the account cannot be recovered
- All user activity (brackets, pool membership) is anonymized (not hard-deleted) so pool data integrity is maintained
- User is logged out and redirected after deletion

---

## Epic: Pools Setup

### 4. Create Bracket Pool (MVP) ✅

**As a** user, **I want to** create a bracket pool **so that** my friends and I can compete.

**Acceptance Criteria:**

- User specifies a pool name (required) and optional image URL
- User sets max brackets per user (default: 5, range: 1-10)
- User sets max participants (default: 50, range: 2-100)
- Default scoring settings are auto-populated:
  - First Four: 0 pts
  - Round of 64: 1 pt
  - Round of 32: 2 pts
  - Sweet 16: 4 pts
  - Elite 8: 8 pts
  - Final Four: 16 pts
  - Championship: 32 pts
- Creator becomes a pool leader
- Pool visibility defaults to private (design should support public toggle later)

### 5. Manage Bracket Pool Settings (MVP) ✅

**As a** pool leader, **I want to** edit pool settings **so that** I can adjust the pool before games start.

**Acceptance Criteria:**

- All creation-time settings can be edited before the tournament starts
- Max brackets per user cannot be set below the current highest bracket count of any user in the pool
- Max participants cannot be set below the current member count
- Only pool leaders can edit settings
- Editing is locked once tournament games begin

---

## Epic: Sports Data

### 6a. Admin Tournament Management (MVP) ✅

**As an** admin, **I want to** manage teams, tournaments, and game data via an admin UI **so that** tournament data can be entered and corrected manually, serving as both a primary data entry method for testing and a fallback/override for automated sync.

**Acceptance Criteria:**

- Users have an `appRole` field (default: "user", can be set to "admin" via database)
- Admin-only routes are protected — non-admin users are redirected
- Admin can CRUD teams (name, short name, abbreviation, logo URL)
- Admin can CRUD tournaments (name, year, active status); only one tournament can be active at a time
- Admin can assign teams to a tournament with seed and region
- Admin can manage tournament games (create matchups, set round/region, assign teams)
- Admin can update game results (scores, status: scheduled/in_progress/final)
- Admin can advance winners to the next round
- Seed scripts exist to populate 68 real 2025 NCAA tournament teams and a mock tournament bracket for testing
- Data model supports: persistent teams, tournaments, tournament_team assignments, tournament games with bracket tree structure (source game references)

### 6b. ESPN Data Sync (MVP — separate implementation) ✅

**As the** system, **I need to** sync live tournament data from ESPN **so that** brackets are scored automatically without manual data entry.

**Acceptance Criteria:**

- Sync bracket/game structure (regions, seeds, matchups) from ESPN scoreboard API
- Sync team info (name, seed, logo/abbreviation)
- Sync game scoring (team scores, game status)
- Sync game schedule (date, time, location)
- Data source: ESPN hidden API (see [research doc](../technical/sports-data-source-research.md))
- Sync runs on a scheduled cron (via cron-job.org)
- Handles in-progress, completed, and upcoming game states
- Built behind an adapter interface so NCAA API can be swapped in as backup
- Admin UI can override any synced data

---

## Epic: Pool Members

### 7. Bracket Pool Invite Links (MVP) ✅

**As a** pool member, **I want to** share an invite link **so that** others can join my pool.

**Acceptance Criteria:**

- Only pool leaders can generate and manage shareable invite links
- Invite link has a configurable expiration (default: 7 days)
- Invite link has configurable max uses (default: remaining pool capacity)
- Invite link can specify a role for joiners (member or leader)
- Expired or maxed-out links show an appropriate error
- Users who follow a valid link and are authenticated are added to the pool

### 8. Manage Pool Members (MVP) ✅

**As a** pool leader, **I want to** manage pool members' roles and remove members **so that** I can control who participates in my pool.

**As a** pool member, **I want to** view the member list and leave a pool **so that** I can see who I'm competing with and opt out if I choose.

**Acceptance Criteria:**

- All pool members can view the full member list (name, role)
- Pool leaders can change a member's role between "member" and "leader"
- Pool leaders can remove any member (including other leaders and the original pool creator)
- Removing a member hard-deletes all of their bracket entries from the pool
- Removal requires a confirmation dialog
- Regular members cannot edit roles or remove other members
- Any member (including leaders) can leave a pool voluntarily
  - Leaving hard-deletes all of the member's bracket entries from the pool
  - Members are warned that their brackets will be removed before confirming
  - A leader cannot leave if they are the last leader in the pool — they must promote another member to leader first
  - If a member is the only person in the pool, leaving deletes the pool entirely
- Only pool leaders see role edit and remove controls in the UI

---

## Epic: Bracket Creation

### 9. Create Bracket Entry (MVP) ✅

**As a** pool member, **I want to** create a bracket entry with my tournament picks **so that** I can compete in the pool.

**Acceptance Criteria:**

- User can create a new bracket entry if they haven't hit the pool's max bracket limit
- Bracket entry has a user-defined name
- UI presents the full tournament bracket for picking game winners
- Each pick auto-saves so progress is not lost
- User must also enter a tiebreaker (predicted total score of the championship game)
- Only brackets with all games picked and a tiebreaker entered can be submitted
- Incomplete brackets are clearly indicated as drafts

### 10. Edit Bracket Entry (MVP)

**As a** pool member, **I want to** edit my bracket entry **so that** I can change my picks before the tournament starts.

**Acceptance Criteria:**

- All picks and tiebreaker can be modified before tournament games begin
- Same auto-save behavior as creation
- Editing is locked once the tournament starts

---

## Epic: Bracket Visibility

### 11. View Own Brackets (MVP) ✅

**As a** user, **I want to** view a list of my brackets within a pool **so that** I can track my performance.

**Acceptance Criteria:**

- User sees a list of their bracket entries in the pool detail page with current points and potential remaining points (after tournament starts)
- User can click into an individual bracket for detail
- Pool standings page shows all brackets including the user's own

### 12. View Other Members' Brackets (MVP) ✅

**As a** pool member, **I want to** view other members' brackets **so that** I can see how my competition is doing.

**Acceptance Criteria:**

- User can view any other member's bracket within a shared pool (read-only)
- Same summary info shown: bracket name, current points, potential remaining points
- Accessible via pool standings page links

### 13. View Pool Standings (MVP) ✅

**As a** pool member, **I want to** see the pool standings **so that** I know where I rank.

**Acceptance Criteria:**

- Standings show all brackets in the pool ordered by: points (desc), then potential points (desc), then tiebreaker accuracy, then alphabetical (asc)
- Each row shows: rank, bracket name, owner (with avatar), champion pick (team logo), current points, potential remaining points
- User can click into any bracket for detail

### 14. View Individual Bracket Detail (MVP) ✅

**As a** user, **I want to** view an individual bracket in detail **so that** I can see every pick and its outcome.

**Acceptance Criteria:**

- Full bracket view showing all rounds and picks
- Each pick shows: teams, winner selected, actual result (if game is played)
- Visual indicators for correct picks, incorrect picks, and pending games
- Points earned per pick are visible
- Any pool member can view any bracket in the pool (read-only for non-owners)

---

## Epic: Scoring & Standings

### 15. Live Bracket Scoring & Standings (MVP) ✅

**As a** pool member, **I want** bracket standings to update automatically as game results are recorded **so that** I can track how I and others are performing in real time.

**Acceptance Criteria:**

- [x] When game results are synced from ESPN, all bracket entries have their scores recalculated automatically
- [x] When an admin manually edits a game result, standings are NOT auto-recalculated — the admin uses the separate "Sync Standings" button to trigger recalculation on demand (intentional: allows batch manual edits without repeated recalculation)
- [x] Each pick is scored based on the pool's round-based scoring settings
- [x] Pool standings reflect current scores and are viewable by all pool members
- [x] Potential remaining points are calculated for each bracket entry (max points still achievable)
- [x] Standings are ordered by: points (desc), potential points (desc), tiebreaker accuracy, then alphabetical
- [x] Architecture decision: admin-triggered batch sync stores `totalPoints` and `potentialPoints` on `bracketEntry` table for fast reads

**Additional work completed in this PR:**

- Bracket view shows correct/incorrect pick indicators (green/red) with points earned per pick
- Bracket view header shows live "Points: X | Potential: Y" summary
- Success/failure CSS variables added to design system
- Create bracket and create invite locked after tournament starts (backend + UI)
- Mobile navigation affordance on bracket list items

---

## Non-MVP Stories

### 16. Manage Bracket Scoring Settings (Non-MVP) — Epic: Pool Settings

**As a** pool leader, **I want to** customize scoring per round **so that** I can tailor the pool's competitiveness.

**Acceptance Criteria:**

- Points per round can be customized individually
- Only pool leaders can edit scoring
- Changes are locked once tournament games begin

### 17. In-App User Invites (Non-MVP) — Epic: Pool Members

**As a** pool member, **I want to** invite existing users by searching for them **so that** I don't need to share a link externally.

**Acceptance Criteria:**

- User can search for other users by username
- Selected users receive an in-app invite notification
- Invited users can accept or decline

### 18. Bracket Pool Public/Private Toggle (Non-MVP) — Epic: Public Pools

**As a** pool leader, **I want to** make my pool public or private **so that** I can control who can discover and join it.

**Acceptance Criteria:**

- Pool can be toggled between public and private
- Private pools are invite-only
- Public pools appear in search results
- Toggle available at creation and in settings

### 19. Theme Toggle (Non-MVP) — Epic: UX

**As a** user, **I want to** switch between light, dark, and system theme modes **so that** I can use the app comfortably in any lighting condition.

**Acceptance Criteria:**

- User can toggle between light, dark, and system theme modes
- Theme preference persists across sessions (via next-themes)
- Toggle is accessible from the user dropdown menu (desktop) and mobile navigation menu
- System mode automatically follows the user's OS preference

### 20. Public Pool Search (Non-MVP) — Epic: Public Pools

**As a** user, **I want to** search for public pools **so that** I can find and join open competitions.

**Acceptance Criteria:**

- User can search public pools by name
- User can filter by brackets-per-entry range and pool size range
- Only pools with available capacity are shown
- User can join directly from search results

---

## Epic: Tech Debt

### 21. Transaction Audit (Non-MVP) — Epic: Tech Debt

**As a** developer, **I want to** audit all existing query functions and server actions for missing transactions **so that** data integrity is guaranteed across the app.

**Acceptance Criteria:**

- Audit all files in `lib/db/queries/` for functions that perform multiple DB writes without a transaction
- Audit all server actions for action functions that call multiple write query functions without wrapping in a transaction
- All query functions that perform multiple writes use `db.transaction()`
- All server actions that call multiple write functions accept/pass a `DbClient` parameter and wrap writes in a single transaction
- Add `DbClient` optional parameter to query functions that need to participate in action-level transactions
- Document any functions that were fixed

---

## Epic: UX Cleanup

### 22. Remove User Dashboard (Non-MVP) ✅ — Epic: UX Cleanup

**As a** user, **I want** the app to default to the Pools page **so that** I land on the most useful page without an unnecessary dashboard.

**Acceptance Criteria:**

- Remove the user dashboard page
- Default authenticated route (`/`) redirects to the Pools page
- Navigation no longer shows a "Dashboard" link

### 23. Remove Admin Dashboard (Non-MVP) ✅ — Epic: UX Cleanup

**As an** admin, **I want** the admin area to default to the Teams tab **so that** I skip the unnecessary dashboard and land on actionable content.

**Acceptance Criteria:**

- Remove the admin dashboard tab/page
- Admin area defaults to the Teams tab
- Admin navigation no longer shows a "Dashboard" link

### 24. Auto-Determine Game Winner from Scores (Non-MVP) ✅ — Epic: UX Cleanup

**As an** admin, **I want** the winning team to be automatically determined when I enter game scores **so that** I don't have to redundantly select the winner.

**Acceptance Criteria:**

- When both team scores are entered and the game is marked as final, the team with the higher score is automatically set as the winner
- Admin no longer needs to manually select the winning team
- Edge case: if scores are tied, no winner is auto-set (admin must resolve)

---

## Epic: Auto-Fill Bracket

### 25. Auto-Fill Bracket Picks (Non-MVP) — Epic: Auto-Fill Bracket

**As a** pool member, **I want to** auto-fill my bracket with generated picks **so that** I can quickly create an entry without manually picking every game.

**Acceptance Criteria:**

- User can choose from two auto-fill strategies:
  - **Chalk (Higher Seed Always)**: the higher-seeded team always wins
  - **Weighted Random**: winners are randomly selected, weighted toward the higher seed based on the seed differential
- Auto-fill populates all remaining unpicked games in the bracket
- User can modify any auto-filled picks before submitting
- Auto-fill is available during bracket creation and editing (before tournament lock)

---

## Epic: Bug Fixes

### 26. Fix Bracket Submit Double-Click (Non-MVP) — Epic: Bug Fixes

**As a** pool member, **I want** bracket submission to show a success indicator on the first click **so that** I don't have to click submit twice.

**Acceptance Criteria:**

- Clicking submit once successfully submits the bracket and shows a success indicator
- Investigate and fix the root cause of requiring two clicks
- Submit button shows loading/disabled state while submission is in progress

---

## Epic: Branding

### 27. Splash / Marketing Page (Non-MVP) — Epic: Branding

**As a** visitor, **I want to** land on an engaging marketing page **so that** I understand what Bracketsball is and am motivated to sign up.

**Acceptance Criteria:**

- Public-facing splash page at `/` for unauthenticated users (authenticated users still redirect to Pools)
- Hero section with app name, tagline, and primary CTA to sign up / log in
- Feature highlights section summarizing the core value props (create pools, pick brackets, compete with friends, live scoring)
- Visual March Madness / basketball theming that conveys the app's purpose
- Responsive design — looks great on mobile, tablet, and desktop
- Fast load time — no heavy assets blocking initial render

### 28. SEO Plan & Implementation (Non-MVP) — Epic: Branding

**As the** product owner, **I want** the app to be discoverable via search engines **so that** organic traffic can find Bracketsball.

**Acceptance Criteria:**

- Metadata: proper `<title>`, `<meta description>`, and Open Graph / Twitter Card tags on all public pages (splash page, login)
- `robots.txt` allows crawling of public pages, disallows authenticated app routes
- `sitemap.xml` generated for public pages
- Structured data (JSON-LD) for the splash page (WebApplication or SoftwareApplication schema)
- Canonical URLs set on all pages
- Lighthouse SEO score ≥ 90 on the splash page
- Document the SEO strategy and any ongoing tasks in `docs/technical/seo-plan.md`

### 29. App Theme & Design System (Non-MVP) ✅ — Epic: Branding

**As a** user, **I want** the app's visual design to feel like a March Madness bracket challenge **so that** the experience is fun and on-brand.

**Acceptance Criteria:**

- Define a cohesive color palette that evokes college basketball / March Madness energy (stored in CSS variables / Tailwind config)
- Update ShadCN theme tokens (primary, secondary, accent, destructive, etc.) to use the new palette
- Typography choices that feel sporty but remain readable
- Consistent application of the new theme across all existing pages (no page-by-page visual inconsistencies)
- Dark mode support with the new palette (can coordinate with Story 19 Theme Toggle)
- Document the design tokens and rationale in `docs/technical/design-system.md`

### 30. Icon Pack (Favicon, App Icons, OAuth) (Non-MVP) — Epic: Branding

**As a** user, **I want** the app to have a recognizable icon **so that** I can identify it in my browser tabs, home screen, and OAuth consent screens.

**Acceptance Criteria:**

- Custom app icon designed that represents Bracketsball (bracket + basketball motif)
- Favicon set: `favicon.ico` (16×16, 32×32), `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`
- PWA manifest (`site.webmanifest`) references the icon pack with correct sizes and MIME types
- Open Graph image (`og-image.png`) for social sharing — 1200×630
- OAuth provider icons: upload the app icon to Google Cloud Console and Discord Developer Portal for branded consent screens
- Icons render correctly across major browsers (Chrome, Safari, Firefox, Edge) and mobile home screen bookmarks

### 31. Legal & Contact Pages (Non-MVP) — Epic: Branding

**As a** visitor or user, **I want** access to a privacy policy, terms of service, and contact information **so that** I understand how my data is handled and how to reach the team.

**Acceptance Criteria:**

- Privacy Policy page at `/privacy` — covers data collection, OAuth data usage, cookies, data retention, and deletion rights
- Terms of Service page at `/terms` — covers acceptable use, account termination, liability limitations
- Contact information accessible from the footer (email or contact form)
- All three pages are publicly accessible (no auth required)
- Footer with links to privacy, terms, and contact is present on the splash page and within the authenticated app
- Pages are styled consistently with the app theme

### 32. Update External Services Branding (Non-MVP) — Epic: Branding

**As the** product owner, **I want to** update the app name, icons, and metadata across all external services **so that** the Bracketsball brand is consistent everywhere.

**Acceptance Criteria:**

- Google Cloud Console: Update OAuth consent screen app name to "Bracketsball", upload app icon (`icon-512.png`)
- Discord Developer Portal: Update application name to "Bracketsball", upload app icon (`icon-512.png`)
- Vercel: Update project name/display name to "Bracketsball"
- GitHub: Update repository description to reflect new name
- Neon: Update project name/description if applicable
- cron-job.org: Update job names/descriptions to reflect new name
- Verify OAuth consent screens show correct name and icon for both Google and Discord flows

---

## Summary

| #   | Story                              | Epic                | MVP | Status      |
| --- | ---------------------------------- | ------------------- | --- | ----------- |
| 0   | Tech Stack Setup                   | Tech Stack Setup    | Yes | Done        |
| 1   | Social Login                       | Auth                | Yes | Done        |
| 2   | Profile Management                 | Profile             | Yes | Done        |
| 3   | Account Deletion                   | Account             | Yes | Done        |
| 4   | Create Bracket Pool                | Pools Setup         | Yes | Done        |
| 5   | Manage Bracket Pool Settings       | Pool Settings       | Yes | Done        |
| 6a  | Admin Tournament Management        | Sports Data         | Yes | Done        |
| 6b  | ESPN Data Sync                     | Sports Data         | Yes | Done        |
| 7   | Bracket Pool Invite Links          | Pool Members        | Yes | Done        |
| 8   | Manage Pool Members                | Pool Members        | Yes | Done        |
| 9   | Create Bracket Entry               | Bracket Creation    | Yes | Done        |
| 10  | Edit Bracket Entry                 | Bracket Creation    | Yes | Done        |
| 11  | View Own Brackets                  | Bracket Visibility  | Yes | Done        |
| 12  | View Other Members' Brackets       | Bracket Visibility  | Yes | Done        |
| 13  | View Pool Standings                | Bracket Visibility  | Yes | Done        |
| 14  | View Individual Bracket Detail     | Bracket Visibility  | Yes | Done        |
| 15  | Live Bracket Scoring & Standings   | Scoring & Standings | Yes | Done        |
| 16  | Manage Bracket Scoring Settings    | Pool Settings       | No  | Not Started |
| 17  | In-App User Invites                | Pool Members        | No  | Not Started |
| 18  | Bracket Pool Public/Private Toggle | Public Pools        | No  | Not Started |
| 19  | Theme Toggle                       | UX                  | No  | Not Started |
| 20  | Public Pool Search                 | Public Pools        | No  | Not Started |
| 21  | Transaction Audit                  | Tech Debt           | No  | Not Started |
| 22  | Remove User Dashboard              | UX Cleanup          | No  | Done        |
| 23  | Remove Admin Dashboard             | UX Cleanup          | No  | Done        |
| 24  | Auto-Determine Game Winner         | UX Cleanup          | No  | Done        |
| 25  | Auto-Fill Bracket Picks            | Auto-Fill Bracket   | No  | Not Started |
| 26  | Fix Bracket Submit Double-Click    | Bug Fixes           | No  | Not Started |
| 27  | Splash / Marketing Page            | Branding            | No  | Dnoe |
| 28  | SEO Plan & Implementation          | Branding            | No  | Not Started |
| 29  | App Theme & Design System          | Branding            | No  | Done        |
| 30  | Icon Pack (Favicon, App, OAuth)    | Branding            | No  | Done        |
| 31  | Legal & Contact Pages              | Branding            | No  | Done        |
| 32  | Update External Services Branding  | Branding            | No  | Not Started |

**MVP Total: 17 stories (17 done, 0 remaining)** | **Post-MVP: 17 stories**
