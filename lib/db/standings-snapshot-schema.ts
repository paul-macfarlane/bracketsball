import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { tournamentRoundEnum } from "./tournament-schema";
import { bracketEntry } from "./bracket-entry-schema";
import { pool } from "./pool-schema";
import { tournament } from "./tournament-schema";

export const standingsSnapshot = pgTable(
  "standings_snapshot",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bracketEntryId: text("bracket_entry_id")
      .notNull()
      .references(() => bracketEntry.id, { onDelete: "cascade" }),
    poolId: text("pool_id")
      .notNull()
      .references(() => pool.id, { onDelete: "cascade" }),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournament.id, { onDelete: "cascade" }),
    round: tournamentRoundEnum("round").notNull(),
    rank: integer("rank").notNull(),
    totalPoints: integer("total_points").notNull(),
    potentialPoints: integer("potential_points").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("standings_snapshot_entry_round_idx").on(
      table.bracketEntryId,
      table.round,
    ),
    index("standings_snapshot_pool_tournament_round_idx").on(
      table.poolId,
      table.tournamentId,
      table.round,
    ),
  ],
);

export const standingsSnapshotRelations = relations(
  standingsSnapshot,
  ({ one }) => ({
    bracketEntry: one(bracketEntry, {
      fields: [standingsSnapshot.bracketEntryId],
      references: [bracketEntry.id],
    }),
    pool: one(pool, {
      fields: [standingsSnapshot.poolId],
      references: [pool.id],
    }),
    tournament: one(tournament, {
      fields: [standingsSnapshot.tournamentId],
      references: [tournament.id],
    }),
  }),
);
