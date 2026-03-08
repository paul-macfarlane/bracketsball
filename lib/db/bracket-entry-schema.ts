import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { pool } from "./pool-schema";
import { tournament, tournamentGame, team } from "./tournament-schema";

export const bracketEntryStatusEnum = pgEnum("bracket_entry_status", [
  "draft",
  "submitted",
]);

export const bracketEntry = pgTable(
  "bracket_entry",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    poolId: text("pool_id")
      .notNull()
      .references(() => pool.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournament.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tiebreakerScore: integer("tiebreaker_score"),
    status: bracketEntryStatusEnum("status").notNull().default("draft"),
    totalPoints: integer("total_points").notNull().default(0),
    potentialPoints: integer("potential_points").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("bracket_entry_pool_id_idx").on(table.poolId),
    index("bracket_entry_user_id_idx").on(table.userId),
    index("bracket_entry_pool_user_idx").on(table.poolId, table.userId),
  ],
);

export const bracketPick = pgTable(
  "bracket_pick",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    bracketEntryId: text("bracket_entry_id")
      .notNull()
      .references(() => bracketEntry.id, { onDelete: "cascade" }),
    tournamentGameId: text("tournament_game_id")
      .notNull()
      .references(() => tournamentGame.id, { onDelete: "cascade" }),
    pickedTeamId: text("picked_team_id")
      .notNull()
      .references(() => team.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("bracket_pick_entry_game_idx").on(
      table.bracketEntryId,
      table.tournamentGameId,
    ),
    index("bracket_pick_entry_id_idx").on(table.bracketEntryId),
  ],
);

// Relations
export const bracketEntryRelations = relations(
  bracketEntry,
  ({ one, many }) => ({
    pool: one(pool, {
      fields: [bracketEntry.poolId],
      references: [pool.id],
    }),
    user: one(user, {
      fields: [bracketEntry.userId],
      references: [user.id],
    }),
    tournament: one(tournament, {
      fields: [bracketEntry.tournamentId],
      references: [tournament.id],
    }),
    picks: many(bracketPick),
  }),
);

export const bracketPickRelations = relations(bracketPick, ({ one }) => ({
  bracketEntry: one(bracketEntry, {
    fields: [bracketPick.bracketEntryId],
    references: [bracketEntry.id],
  }),
  tournamentGame: one(tournamentGame, {
    fields: [bracketPick.tournamentGameId],
    references: [tournamentGame.id],
  }),
  pickedTeam: one(team, {
    fields: [bracketPick.pickedTeamId],
    references: [team.id],
  }),
}));
