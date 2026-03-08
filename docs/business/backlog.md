# BRacketiering Backlog

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

### 6b. ESPN Data Sync (MVP — separate implementation)

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

- [x] When a game result is recorded (via admin UI or ESPN sync), all bracket entries with picks for that game have their scores recalculated — admin "Sync Standings" button triggers bulk recalculation
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
| 6b  | ESPN Data Sync                     | Sports Data         | Yes | Not Started |
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

**MVP Total: 17 stories (16 done, 1 remaining)** | **Post-MVP: 6 stories**
