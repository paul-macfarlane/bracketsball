import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { DEFAULT_SCORING } from "@/lib/scoring";

export const poolVisibilityEnum = pgEnum("pool_visibility", [
  "private",
  "public",
]);

export const poolUserInviteStatusEnum = pgEnum("pool_user_invite_status", [
  "pending",
  "accepted",
  "declined",
]);

export const poolMemberRoleEnum = pgEnum("pool_member_role", [
  "leader",
  "member",
]);

export const pool = pgTable("pool", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  visibility: poolVisibilityEnum("visibility").notNull().default("private"),
  imageUrl: text("image_url"),
  maxBracketsPerUser: integer("max_brackets_per_user").notNull().default(5),
  maxParticipants: integer("max_participants").notNull().default(50),
  scoringFirstFour: integer("scoring_first_four")
    .notNull()
    .default(DEFAULT_SCORING.firstFour),
  scoringRound64: integer("scoring_round_64")
    .notNull()
    .default(DEFAULT_SCORING.round64),
  scoringRound32: integer("scoring_round_32")
    .notNull()
    .default(DEFAULT_SCORING.round32),
  scoringSweet16: integer("scoring_sweet_16")
    .notNull()
    .default(DEFAULT_SCORING.sweet16),
  scoringElite8: integer("scoring_elite_8")
    .notNull()
    .default(DEFAULT_SCORING.elite8),
  scoringFinalFour: integer("scoring_final_four")
    .notNull()
    .default(DEFAULT_SCORING.finalFour),
  scoringChampionship: integer("scoring_championship")
    .notNull()
    .default(DEFAULT_SCORING.championship),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const poolMember = pgTable(
  "pool_member",
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
    role: poolMemberRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("pool_member_pool_id_idx").on(table.poolId),
    index("pool_member_user_id_idx").on(table.userId),
  ],
);

export const poolInvite = pgTable(
  "pool_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code")
      .notNull()
      .$defaultFn(() => crypto.randomUUID()),
    poolId: text("pool_id")
      .notNull()
      .references(() => pool.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: poolMemberRoleEnum("role").notNull().default("member"),
    maxUses: integer("max_uses"),
    useCount: integer("use_count").notNull().default(0),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("pool_invite_code_idx").on(table.code),
    index("pool_invite_pool_id_idx").on(table.poolId),
  ],
);

export const poolUserInvite = pgTable(
  "pool_user_invite",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    poolId: text("pool_id")
      .notNull()
      .references(() => pool.id, { onDelete: "cascade" }),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    invitedUserId: text("invited_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: poolUserInviteStatusEnum("status").notNull().default("pending"),
    role: poolMemberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    respondedAt: timestamp("responded_at"),
  },
  (table) => [
    index("pool_user_invite_pool_id_idx").on(table.poolId),
    index("pool_user_invite_invited_user_id_idx").on(table.invitedUserId),
    index("pool_user_invite_invited_by_idx").on(table.invitedBy),
  ],
);

export const poolRelations = relations(pool, ({ many }) => ({
  members: many(poolMember),
  invites: many(poolInvite),
  userInvites: many(poolUserInvite),
}));

export const poolMemberRelations = relations(poolMember, ({ one }) => ({
  pool: one(pool, {
    fields: [poolMember.poolId],
    references: [pool.id],
  }),
  user: one(user, {
    fields: [poolMember.userId],
    references: [user.id],
  }),
}));

export const poolInviteRelations = relations(poolInvite, ({ one }) => ({
  pool: one(pool, {
    fields: [poolInvite.poolId],
    references: [pool.id],
  }),
  creator: one(user, {
    fields: [poolInvite.createdBy],
    references: [user.id],
  }),
}));

export const poolUserInviteRelations = relations(poolUserInvite, ({ one }) => ({
  pool: one(pool, {
    fields: [poolUserInvite.poolId],
    references: [pool.id],
  }),
  sender: one(user, {
    fields: [poolUserInvite.invitedBy],
    references: [user.id],
    relationName: "sentUserInvites",
  }),
  recipient: one(user, {
    fields: [poolUserInvite.invitedUserId],
    references: [user.id],
    relationName: "receivedUserInvites",
  }),
}));
