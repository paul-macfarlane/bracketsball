# ESPN Data Sync — Operations Guide

## How It Works

The sync pulls live game data from ESPN's public scoreboard API and updates the tournament in the database. It runs in three phases:

1. **Fetch** — Hits `site.api.espn.com` for a given date's scoreboard, filters to March Madness games (tournament ID 22), and parses round/region/teams/scores from the response.

2. **Match & Update** — Each ESPN game is matched to an existing DB game. First by `espnEventId` (stored after the first successful match), then by positional matching (round + region + seed matchup). Once matched, the DB game is updated with scores, status, venue, start time, and teams.

3. **Advance Winners** — When a game is marked final, the winner is automatically placed into the correct slot of the next-round game (via the `sourceGame1Id`/`sourceGame2Id` tree). Standings are recalculated after all updates.

All writes happen in a single database transaction.

## Sync Triggers

There are three ways to trigger a sync:

| Trigger             | What it syncs                           | How to use                                                      |
| ------------------- | --------------------------------------- | --------------------------------------------------------------- |
| **Cron endpoint**   | Today's games for the active tournament | `GET /api/sync-espn` with `Authorization: Bearer <CRON_SECRET>` |
| **Admin UI button** | Today's games for the viewed tournament | "Sync from ESPN" button on Admin > Tournament > Games           |
| **Test script**     | Full date range for a historical year   | `pnpm sync:test 2024`                                           |

## March Madness Operations Timeline

### Before the Tournament (Selection Sunday + week before First Four)

**Option A: Use the sync script (recommended)**

The script handles everything — tournament creation, team seeding, and bracket generation:

1. Add the year's config to `YEAR_CONFIGS` in `scripts/test-espn-sync.ts` (phases + bracket positions).
2. Run `pnpm sync:test <year>` — this creates the tournament, discovers all 68 teams from ESPN, and generates the full 67-game bracket.
3. Mark the tournament as active in Admin UI.
4. **Pool setup** — Make sure pools are created and members have submitted their bracket picks before games start.

You don't need to manually create the tournament, seed teams, or generate the bracket — the script does all of it.

**Option B: Manual setup via Admin UI**

1. Create the tournament — set year, name, mark as active.
2. Seed teams — Run `pnpm db:seed:teams` or add manually.
3. Assign all 68 teams with correct seeds and regions.
4. Configure bracket positions (which region in each quadrant).
5. Click "Generate Bracket".
6. Set up pools and collect bracket picks.

### During the Tournament

**Cron schedule recommendations:**

| Phase        | Dates (approx)     | Suggested cron schedule   |
| ------------ | ------------------ | ------------------------- |
| First Four   | Tue-Wed before R64 | Every 15 min, 6pm-1am ET  |
| Round of 64  | Thu-Fri            | Every 10 min, 12pm-1am ET |
| Round of 32  | Sat-Sun            | Every 10 min, 12pm-1am ET |
| Sweet 16     | Thu-Fri (week 2)   | Every 10 min, 7pm-1am ET  |
| Elite 8      | Sat-Sun (week 2)   | Every 10 min, 2pm-1am ET  |
| Final Four   | Saturday (week 3)  | Every 5 min, 6pm-1am ET   |
| Championship | Monday (week 3)    | Every 5 min, 9pm-1am ET   |
| Off days     | Any non-game day   | Once daily (or skip)      |

A simpler approach: **every 15 minutes from noon to 1am ET during the tournament window** covers all scenarios without over-complicating the schedule.

Set this up at [cron-job.org](https://cron-job.org):

- URL: `https://your-domain.com/api/sync-espn`
- Method: GET
- Header: `Authorization: Bearer <your-CRON_SECRET>`

### What Each Sync Does

- **Scheduled games**: Captures start time, venue, and team assignments (useful for games where teams aren't known yet, like later rounds).
- **In-progress games**: Updates scores in real-time. Status changes to `in_progress`.
- **Final games**: Sets final scores, determines winner, advances winner to next round, recalculates standings for all pools.

### Manual Intervention

The admin UI "Sync from ESPN" button is useful for:

- Testing that the sync works before setting up the cron
- Forcing an immediate update if the cron hasn't fired yet
- Debugging — check the games page after syncing to verify scores

The existing admin game edit UI still works as an override. If ESPN has wrong data (rare), you can manually edit any game's scores/status.

## Environment Setup

Add to `.env.local`:

```
CRON_SECRET=some-random-secret-string
```

If `CRON_SECRET` is empty or unset, the cron endpoint accepts requests without auth (fine for local dev, not for production).

## Testing with Historical Data

Validate the entire pipeline against a completed tournament:

```bash
pnpm sync:test 2024
```

This creates a tournament, seeds teams from ESPN, generates the bracket, syncs all games across the full date range, and validates that all 67 games are captured with correct winners. The 2024 champion should show as "Connecticut".

### Progressive Simulation

To simulate how syncing works round-by-round (as it would during a live tournament):

```bash
pnpm sync:test 2024 --progressive
```

This pauses between each phase (First Four, Round of 64, Round of 32, etc.) and shows the DB state after each sync. Press Enter to advance to the next phase. This lets you:

- See how teams populate into later rounds as winners advance
- Verify that scores/status update correctly at each stage
- Confirm the bracket tree stays consistent throughout
- Build confidence in the sync before relying on it for a live tournament

The tournament persists in the database after the script runs. Re-running for the same year replaces it.

Supported years: 2023, 2024, 2026 (placeholder). To add a new year, add its phase dates and bracket positions to `YEAR_CONFIGS` in the script.

### Adding a New Year

In `scripts/test-espn-sync.ts`, add an entry to `YEAR_CONFIGS`:

```typescript
2026: {
  phases: [
    { name: "First Four", start: "2026-03-17", end: "2026-03-18" },
    { name: "Round of 64", start: "2026-03-19", end: "2026-03-20" },
    // ... etc
  ],
  positions: {
    topLeft: "south",       // Update after Selection Sunday
    bottomLeft: "east",     // Update after Selection Sunday
    topRight: "west",       // Update after Selection Sunday
    bottomRight: "midwest", // Update after Selection Sunday
  },
},
```

**What you need to fill in:**

- **Phase dates**: Follow the standard pattern (First Four Tue-Wed, R64 Thu-Fri, R32 Sat-Sun, Sweet 16 Thu-Fri week 2, Elite 8 Sat-Sun week 2, Final Four Sat week 3, Championship Mon week 3). Exact dates are announced by the NCAA each year.
- **Bracket positions**: Which region appears in each quadrant of the bracket. This determines which regions' Elite 8 winners play each other in the Final Four. Announced on Selection Sunday.

A 2026 placeholder config with estimated dates is already in the script — just update the dates and positions when they're announced.

## Troubleshooting

**Sync returns 0 games updated**: ESPN may not have games for that date. Check that the tournament is marked as active (for cron) or that you're viewing the right tournament (for admin button).

**Games matched but scores missing**: The game may be in `scheduled` status on ESPN's side. Scores populate once the game starts.

**Wrong team in next round slot**: The sync advances winners automatically. If a game result changes (extremely rare), the sync will update the game but won't undo an advancement. Use the admin game edit UI to manually fix the next-round game.

**`espnEventId` not set on some games**: First sync uses positional matching which can fail for later rounds if multiple unmatched games exist in the same round+region. Once a game gets its `espnEventId`, all future syncs match instantly. Running the sync daily during the tournament ensures games get their IDs as teams are determined.
