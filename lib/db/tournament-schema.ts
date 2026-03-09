import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const tournamentRoundEnum = pgEnum("tournament_round", [
  "first_four",
  "round_of_64",
  "round_of_32",
  "sweet_16",
  "elite_8",
  "final_four",
  "championship",
]);

export const tournamentRegionEnum = pgEnum("tournament_region", [
  "south",
  "east",
  "west",
  "midwest",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "scheduled",
  "in_progress",
  "final",
]);

export const team = pgTable(
  "team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    logoUrl: text("logo_url"),
    espnId: text("espn_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("team_espn_id_unique_idx").on(table.espnId)],
);

export const tournament = pgTable(
  "tournament",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    year: integer("year").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    bracketTopLeftRegion: tournamentRegionEnum("bracket_top_left_region"),
    bracketBottomLeftRegion: tournamentRegionEnum("bracket_bottom_left_region"),
    bracketTopRightRegion: tournamentRegionEnum("bracket_top_right_region"),
    bracketBottomRightRegion: tournamentRegionEnum(
      "bracket_bottom_right_region",
    ),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [uniqueIndex("tournament_year_unique_idx").on(table.year)],
);

export const tournamentTeam = pgTable(
  "tournament_team",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournament.id, { onDelete: "cascade" }),
    teamId: text("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    seed: integer("seed").notNull(),
    region: tournamentRegionEnum("region").notNull(),
  },
  (table) => [
    uniqueIndex("tournament_team_unique_idx").on(
      table.tournamentId,
      table.teamId,
    ),
    index("tournament_team_tournament_id_idx").on(table.tournamentId),
  ],
);

export const tournamentGame = pgTable(
  "tournament_game",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournament.id, { onDelete: "cascade" }),
    round: tournamentRoundEnum("round").notNull(),
    region: tournamentRegionEnum("region"),
    gameNumber: integer("game_number").notNull(),
    team1Id: text("team1_id").references(() => team.id),
    team2Id: text("team2_id").references(() => team.id),
    team1Score: integer("team1_score"),
    team2Score: integer("team2_score"),
    winnerTeamId: text("winner_team_id").references(() => team.id),
    status: gameStatusEnum("status").notNull().default("scheduled"),
    startTime: timestamp("start_time"),
    venueName: text("venue_name"),
    venueCity: text("venue_city"),
    venueState: text("venue_state"),
    espnEventId: text("espn_event_id"),
    sourceGame1Id: text("source_game1_id"),
    sourceGame2Id: text("source_game2_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tournament_game_tournament_id_idx").on(table.tournamentId),
    index("tournament_game_round_idx").on(table.tournamentId, table.round),
    uniqueIndex("tournament_game_espn_event_id_unique_idx").on(
      table.espnEventId,
    ),
  ],
);

// Relations
export const teamRelations = relations(team, ({ many }) => ({
  tournamentTeams: many(tournamentTeam),
}));

export const tournamentRelations = relations(tournament, ({ many }) => ({
  tournamentTeams: many(tournamentTeam),
  games: many(tournamentGame),
}));

export const tournamentTeamRelations = relations(tournamentTeam, ({ one }) => ({
  tournament: one(tournament, {
    fields: [tournamentTeam.tournamentId],
    references: [tournament.id],
  }),
  team: one(team, {
    fields: [tournamentTeam.teamId],
    references: [team.id],
  }),
}));

export const tournamentGameRelations = relations(tournamentGame, ({ one }) => ({
  tournament: one(tournament, {
    fields: [tournamentGame.tournamentId],
    references: [tournament.id],
  }),
  team1: one(team, {
    fields: [tournamentGame.team1Id],
    references: [team.id],
    relationName: "team1Games",
  }),
  team2: one(team, {
    fields: [tournamentGame.team2Id],
    references: [team.id],
    relationName: "team2Games",
  }),
  winnerTeam: one(team, {
    fields: [tournamentGame.winnerTeamId],
    references: [team.id],
    relationName: "wonGames",
  }),
  sourceGame1: one(tournamentGame, {
    fields: [tournamentGame.sourceGame1Id],
    references: [tournamentGame.id],
    relationName: "sourceGame1",
  }),
  sourceGame2: one(tournamentGame, {
    fields: [tournamentGame.sourceGame2Id],
    references: [tournamentGame.id],
    relationName: "sourceGame2",
  }),
}));
